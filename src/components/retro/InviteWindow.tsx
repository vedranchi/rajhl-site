import { Window } from "./chrome";
import { TelegramIcon } from "./icons";
import { telegramInvite, telegramMembers } from "@/data/content";

/**
 * Design-only invite form. Inert: the button is type="button" and there is no
 * submit handler yet. TODO (later): a server action that emails the entry to the
 * client (Resend/Postmark) and returns the private Telegram invite link.
 */
export function InviteWindow() {
  return (
    <Window
      title="PRIVATE_GROUP — Invite Request"
      icon="tg"
      className="formwin"
      ariaLabel="Private Telegram group invite"
    >
      <div className="formbody">
        <div className="formhead">
          <span className="tgbig" aria-hidden="true">
            <TelegramIcon />
          </span>
          <div>
            <h2 className="formtitle">Join the inner circle</h2>
            <p className="formsub">
              Private Telegram group — early beats, free loops &amp; subscriber-only discounts.
              Request your invite:
            </p>
          </div>
        </div>
        <form className="invite" aria-label="Request a Telegram invite">
          <div className="field">
            <label htmlFor="inv-user">
              Username <b>*</b>
            </label>
            <input id="inv-user" name="username" type="text" placeholder="@yourhandle" autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="inv-mail">
              Email <b>*</b>
            </label>
            <input id="inv-mail" name="email" type="email" placeholder="you@email.com" autoComplete="off" />
          </div>
          <button type="button" className="btn accent invitebtn">
            REQUEST INVITE ►
          </button>
          <p className="formfine">✓ No spam · your invite arrives by email · unsubscribe anytime</p>
        </form>
        <a className="online" href={telegramInvite} target="_blank" rel="noopener noreferrer">
          <span className="odot" aria-hidden="true" /> {telegramMembers} subscribers inside — open Telegram ↗
        </a>
      </div>
    </Window>
  );
}
