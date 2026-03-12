import { AppealCategory, AppealStatus, EnrollmentStatus, Prisma } from "@prisma/client";

export type TransferMessageData = {
  voucherEmail: string;
  currentProviderId: string;
  targetProviderId: string;
  currentSport: string;
  targetSport: string;
};

export type ChildTransferResult = {
  childId: string;
  childName: string;
  childIin: string;
  success: boolean;
  enrollmentId?: string;
  error?: string;
};

export type TransferResponse = {
  success: boolean;
  allTransferred: boolean;
  results: ChildTransferResult[];
};

type PrismaTransactionClient = Prisma.TransactionClient;

type AppealWithChildren = Prisma.AppealGetPayload<{
  include: {
    children: true;
  };
}>;

const REQUIRED_FIELDS: Array<keyof TransferMessageData> = [
  "voucherEmail",
  "currentProviderId",
  "targetProviderId",
  "currentSport",
  "targetSport",
];

export function parseTransferMessage(message: string): TransferMessageData {
  const lines = message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed: Partial<TransferMessageData> = {};

  for (const line of lines) {
    const [rawKey, ...rawValueParts] = line.split(":");
    if (!rawKey || rawValueParts.length === 0) {
      continue;
    }

    const key = rawKey.trim().toLowerCase();
    const value = rawValueParts.join(":").trim();

    if (key === "email ваучера") {
      parsed.voucherEmail = value;
    } else if (key === "id текущего поставщика") {
      parsed.currentProviderId = value;
    } else if (key === "id желаемого поставщика") {
      parsed.targetProviderId = value;
    } else if (key === "текущий вид спорта") {
      parsed.currentSport = value;
    } else if (key === "желаемый вид спорта") {
      parsed.targetSport = value;
    }
  }

  const missing = REQUIRED_FIELDS.filter((field) => !parsed[field]);
  if (missing.length > 0) {
    throw new Error(`Transfer message is missing required fields: ${missing.join(", ")}`);
  }

  return parsed as TransferMessageData;
}

export async function transferAppeal(
  tx: PrismaTransactionClient,
  appealId: string,
): Promise<TransferResponse> {
  const appeal = await tx.appeal.findUnique({
    where: { id: appealId },
    include: { children: true },
  });

  if (!appeal) {
    throw new Error("Appeal not found");
  }

  validateAppeal(appeal);

  const payload = parseTransferMessage(appeal.message);

  const [currentProvider, targetProvider, parent] = await Promise.all([
    tx.sportsCenter.findUnique({ where: { id: payload.currentProviderId } }),
    tx.sportsCenter.findUnique({ where: { id: payload.targetProviderId } }),
    tx.user.findUnique({ where: { email: payload.voucherEmail } }),
  ]);

  if (!currentProvider) {
    throw new Error("Current sports center not found");
  }

  if (!targetProvider) {
    throw new Error("Target sports center not found");
  }

  if (!parent) {
    throw new Error("Parent not found for voucher email");
  }

  const results: ChildTransferResult[] = [];

  for (const child of appeal.children) {
    try {
      const result = await transferChild({
        tx,
        child,
        parentId: parent.id,
        currentProviderId: currentProvider.id,
        targetProviderId: targetProvider.id,
        targetSport: payload.targetSport,
      });

      results.push(result);
    } catch (error) {
      results.push({
        childId: child.id,
        childName: child.childName,
        childIin: child.childIin,
        success: false,
        error: error instanceof Error ? error.message : "Unknown transfer error",
      });
    }
  }

  const allTransferred = results.every((result) => result.success);

  if (allTransferred) {
    await tx.appeal.update({
      where: { id: appeal.id },
      data: { status: AppealStatus.RESOLVED },
    });
  }

  return {
    success: results.some((result) => result.success),
    allTransferred,
    results,
  };
}

function validateAppeal(appeal: AppealWithChildren) {
  if (appeal.category !== AppealCategory.CHANGE_PROVIDER) {
    throw new Error("Only CHANGE_PROVIDER appeals can be transferred");
  }

  if (appeal.status === AppealStatus.RESOLVED) {
    throw new Error("Appeal is already resolved");
  }
}

async function transferChild(params: {
  tx: PrismaTransactionClient;
  child: AppealWithChildren["children"][number];
  parentId: string;
  currentProviderId: string;
  targetProviderId: string;
  targetSport: string;
}): Promise<ChildTransferResult> {
  const { tx, child, parentId, currentProviderId, targetProviderId, targetSport } = params;

  const athlete = await tx.athleteProfile.findUnique({
    where: { iin: child.childIin },
  });

  if (!athlete) {
    throw new Error("Athlete profile not found");
  }

  const currentEnrollment = await tx.enrollment.findFirst({
    where: {
      athleteProfileId: athlete.id,
      sportsCenterId: currentProviderId,
      status: EnrollmentStatus.APPROVED,
    },
    include: {
      program: true,
    },
  });

  if (!currentEnrollment) {
    throw new Error("Approved enrollment at current provider not found");
  }

  const targetProgram = await findAvailableTargetProgram(tx, targetProviderId, targetSport);

  const updatedEnrollment = await tx.enrollment.update({
    where: { id: currentEnrollment.id },
    data: {
      sportsCenterId: targetProviderId,
      programId: targetProgram.id,
      parentId,
      status: EnrollmentStatus.PENDING,
    },
  });

  return {
    childId: child.id,
    childName: child.childName,
    childIin: child.childIin,
    success: true,
    enrollmentId: updatedEnrollment.id,
  };
}

async function findAvailableTargetProgram(
  tx: PrismaTransactionClient,
  sportsCenterId: string,
  sportType: string,
) {
  const programs = await tx.sportsCenterProgram.findMany({
    where: {
      sportsCenterId,
      sportType,
    },
    include: {
      _count: {
        select: {
          enrollments: {
            where: {
              status: {
                in: [EnrollmentStatus.APPROVED, EnrollmentStatus.PENDING],
              },
            },
          },
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  const availableProgram = programs.find((program) => program._count.enrollments < program.capacity);

  if (!availableProgram) {
    throw new Error("No available program at target provider");
  }

  return availableProgram;
}
