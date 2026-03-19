import { kickCommand } from "./kick.js";
import { banCommand } from "./ban.js";
import { unbanCommand } from "./unban.js";
import { timeoutCommand } from "./timeout.js";
import { untimeoutCommand } from "./untimeout.js";
import { warnCommand } from "./warn.js";
import { warningsCommand } from "./warnings.js";
import { clearwarningsCommand } from "./clearwarnings.js";
import { clearCommand } from "./clear.js";
import { slowmodeCommand } from "./slowmode.js";
import { ticketCommand } from "./ticket.js";
import { lockCommand } from "./lock.js";
import { unlockCommand } from "./unlock.js";
import { roleCommand } from "./role.js";
import type { Command } from "../types.js";

export const commands: Command[] = [
  kickCommand,
  banCommand,
  unbanCommand,
  timeoutCommand,
  untimeoutCommand,
  warnCommand,
  warningsCommand,
  clearwarningsCommand,
  clearCommand,
  slowmodeCommand,
  ticketCommand,
  lockCommand,
  unlockCommand,
  roleCommand,
];
