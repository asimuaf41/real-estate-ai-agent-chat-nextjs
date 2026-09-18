import { USER_SPEND_CAP_USD } from "@/lib/spendCap";
import { getLifetimeSpendUsd } from "@/lib/usageLogger";
import { ANONYMOUS_USER_ID } from "./request";
import { createSseErrorResponse } from "./sse";

export async function rejectIfOverSpendCap(
  userId: string,
): Promise<Response | null> {
  if (!userId || userId === ANONYMOUS_USER_ID) {
    return null;
  }

  try {
    const spent = await getLifetimeSpendUsd(userId);
    if (spent >= USER_SPEND_CAP_USD) {
      return createSseErrorResponse(
        new Error(
          `You've reached your usage limit. Ask the workspace owner if you need more.`,
        ),
      );
    }
  } catch (error) {
    console.error("Spend cap check failed:", error);
  }

  return null;
}
