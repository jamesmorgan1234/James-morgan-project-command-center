import type { RuntimeSnapshotProvider } from "./provider.js";
import type { CommandCenterRuntimeSnapshot, RuntimeBrainConversation, RuntimeBrainConversationTurn, RuntimeBrainImprovementProposal, RuntimeBrainProjectWorkspace } from "./snapshot.js";
import { isBrainConversationRuntimeProvider } from "./owner-security-provider.js";
import { createDefaultBrowserVoiceRegistry, type BrowserVoiceCapture } from "./browser-voice.js";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function card(className = ""): HTMLElement {
  return el("article", `bevel-card brain-card ${className}`.trim());
}

function pill(label: string, state: string): HTMLElement {
  const node = el("span", `status status--${state.replace(/[^a-z0-9-]/giu, "-").toLowerCase()}`, label);
  node.prepend(el("span", "status__dot"));
  return node;
}

function emptyState(title: string, body: string, state: string): HTMLElement {
  const node = card("brain-empty-state");
  node.append(el("h2", "section-title", title), el("p", "muted", body), pill(state.toUpperCase(), state));
  return node;
}

function brainHref(projectId?: string, conversationId?: string, forceNew = false): string {
  const params = new URLSearchParams();
  if (projectId) params.set("project", projectId);
  if (conversationId) params.set("conversation", conversationId);
  if (projectId || conversationId) params.set("mode", "conversation");
  if (forceNew) params.set("new", "1");
  const query = params.toString();
  return query ? `/brain?${query}` : "/brain";
}

function routeLink(label: string, path: string, className: string, rerender: () => Promise<void>): HTMLAnchorElement {
  const link = el("a", className, label);
  link.href = path;
  link.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.pushState({}, "", path);
    void rerender();
  });
  return link;
}

function conversationTurn(turn: RuntimeBrainConversationTurn): HTMLElement {
  const node = card(`brain-turn brain-turn--${turn.role}`);
  const heading = el("div", "brain-turn__heading");
  heading.append(el("strong", "brain-turn__role", turn.role.toUpperCase()));
  if (turn.intent) heading.append(pill(turn.intent.replaceAll("_", " ").toUpperCase(), turn.protectedActionPossible ? "candidate" : "available"));
  node.append(heading);
  if (turn.content.state === "known") node.append(el("p", "brain-turn__content", turn.content.value));
  else if (turn.redactionState === "redacted") node.append(el("p", "muted", "This turn is redacted in the canonical conversation record."));
  else node.append(el("p", "muted", "This turn is reference-only; no substitute text is inferred."));
  const metadata = el("p", "brain-turn__meta", `${turn.createdAt} · ${turn.evidence.length} evidence ref${turn.evidence.length === 1 ? "" : "s"}`);
  node.append(metadata);
  if (turn.protectedActionPossible) {
    node.append(el("p", "brain-protected-notice", "Protected-action intent recorded only. This conversation turn does not authorize or execute the action."));
  }
  return node;
}

function workspaceCard(workspace: RuntimeBrainProjectWorkspace | undefined): HTMLElement {
  const node = card("brain-workspace");
  node.append(el("h2", "section-title", "PROJECT WORKSPACE"));
  if (!workspace) {
    node.append(el("p", "muted", "No durable Brain workspace exists for this project yet. The first persisted project conversation can create one without reconstructing state from chat history."));
    return node;
  }
  const facts = el("dl", "history-facts");
  facts.append(
    el("dt", undefined, "Version"), el("dd", undefined, String(workspace.version)),
    el("dt", undefined, "Spec version"), el("dd", undefined, String(workspace.specVersion)),
    el("dt", undefined, "Conversation"), el("dd", undefined, workspace.conversationId.state === "known" ? workspace.conversationId.value : "N/A"),
    el("dt", undefined, "Turns"), el("dd", undefined, String(workspace.turnIds.length)),
    el("dt", undefined, "Decisions"), el("dd", undefined, String(workspace.decisionRefs.length)),
    el("dt", undefined, "Blockers"), el("dd", undefined, String(workspace.blockerRefs.length)),
    el("dt", undefined, "Verified results"), el("dd", undefined, String(workspace.verifiedResultRefs.length)),
    el("dt", undefined, "Updated"), el("dd", undefined, workspace.updatedAt)
  );
  node.append(facts);
  return node;
}

function conversationList(conversations: readonly RuntimeBrainConversation[], selectedId: string | undefined, projectId: string | undefined, rerender: () => Promise<void>): HTMLElement {
  const list = card("brain-conversation-list");
  const heading = el("div", "brain-card__heading");
  heading.append(el("h2", "section-title", "CONVERSATIONS"), pill(String(conversations.length), conversations.length ? "available" : "unavailable"));
  list.append(heading);
  if (conversations.length === 0) {
    list.append(el("p", "muted", projectId ? "No persistent Brain conversation is currently recorded for this project." : "No persistent Brain conversations are currently recorded."));
    return list;
  }
  for (const conversation of conversations) {
    const link = routeLink("", brainHref(projectId ?? conversation.projectId, conversation.id), "brain-conversation-link", rerender);
    if (conversation.id === selectedId) link.setAttribute("aria-current", "page");
    const text = el("span", "brain-conversation-link__text");
    text.append(el("strong", undefined, conversation.title), el("span", "muted", `${conversation.turns.length} turn${conversation.turns.length === 1 ? "" : "s"} · ${conversation.state}`));
    link.append(text, el("span", "brain-conversation-link__time", conversation.updatedAt));
    list.append(link);
  }
  return list;
}

function conversationPanel(conversation: RuntimeBrainConversation | undefined): HTMLElement {
  const panel = el("section", "brain-thread");
  if (!conversation) {
    panel.append(emptyState("No conversation selected", "Start with the composer below. Owner input is persisted only when the authenticated Brain runtime is available; no local fake conversation is created.", "unavailable"));
    return panel;
  }
  const header = card("brain-thread__header");
  const heading = el("div", "brain-card__heading");
  heading.append(el("h2", "section-title", conversation.title), pill(conversation.state.toUpperCase(), conversation.state === "active" ? "available" : "stale"));
  header.append(heading, el("p", "muted", conversation.projectId ? `Project-scoped conversation · ${conversation.projectId}` : "Command Center Brain conversation"));
  panel.append(header);
  if (conversation.turns.length === 0) panel.append(emptyState("Conversation has no recorded turns", "The durable conversation exists, but no owner/Brain/system turn has been recorded yet.", "unavailable"));
  else for (const turn of conversation.turns) panel.append(conversationTurn(turn));
  return panel;
}

function improvementsCenter(
  proposals: readonly RuntimeBrainImprovementProposal[],
  projectId: string | undefined,
  provider: RuntimeSnapshotProvider | undefined,
  rerender: () => Promise<void>
): HTMLElement {
  const center = card("brain-improvements-center");
  const scoped = projectId ? proposals.filter((proposal) => !proposal.projectId || proposal.projectId === projectId) : proposals;
  const heading = el("div", "brain-card__heading");
  heading.append(el("h2", "section-title", "IMPROVEMENTS CENTER"), pill(String(scoped.length), scoped.length ? "available" : "unavailable"));
  center.append(
    heading,
    el("p", "muted", "Evidence-backed recommendations only. Improvements never self-install, never silently rewrite roadmap scope, and require an explicit owner decision before conversion to a structured scope request.")
  );
  if (scoped.length === 0) {
    center.append(el("p", "brain-improvement-empty", "No evidence-backed improvement proposal is currently recorded for this context."));
    return center;
  }
  const writable = !!provider && isBrainConversationRuntimeProvider(provider);
  for (const proposal of scoped) {
    const item = el("article", "brain-improvement");
    const itemHeading = el("div", "brain-card__heading");
    itemHeading.append(el("strong", "brain-improvement__title", proposal.title), pill(proposal.state.replaceAll("_", " ").toUpperCase(), proposal.state === "proposed" ? "candidate" : proposal.state === "rejected" ? "stale" : "available"));
    item.append(
      itemHeading,
      el("p", "brain-improvement__meta", `${proposal.area.replaceAll("_", " ")} · confidence ${Math.round(proposal.confidence * 100)}% · ${proposal.evidenceRefs.length} evidence ref${proposal.evidenceRefs.length === 1 ? "" : "s"}`),
      el("p", "muted", `Detail: ${proposal.detailRef}`),
      el("p", "brain-protected-notice", "Automatic installation: disabled. Roadmap mutation: not authorized by this proposal or decision.")
    );
    const actionStatus = el("p", "brain-improvement__status muted", proposal.state === "converted_to_scope" ? "Converted to a structured scope request. The roadmap itself was not silently mutated." : "");
    const actions = el("div", "brain-improvement__actions");
    const runAction = (button: HTMLButtonElement, action: () => Promise<unknown>, pending: string, failed: string): void => {
      button.addEventListener("click", () => {
        void (async () => {
          for (const candidate of actions.querySelectorAll<HTMLButtonElement>("button")) candidate.disabled = true;
          actionStatus.textContent = pending;
          try {
            await action();
            await rerender();
          } catch {
            for (const candidate of actions.querySelectorAll<HTMLButtonElement>("button")) candidate.disabled = false;
            actionStatus.textContent = failed;
          }
        })();
      });
    };
    if (proposal.state === "proposed") {
      const accept = el("button", "cc-button brain-improvement__accept", "Accept proposal");
      accept.type = "button";
      const reject = el("button", "cc-button cc-button--secondary brain-improvement__reject", "Reject proposal");
      reject.type = "button";
      accept.disabled = !writable;
      reject.disabled = !writable;
      if (writable && provider && isBrainConversationRuntimeProvider(provider)) {
        runAction(accept, () => provider.decideBrainImprovement(proposal.id, "accepted"), "Recording explicit owner acceptance…", "Acceptance could not be recorded. Proposal state was not changed locally.");
        runAction(reject, () => provider.decideBrainImprovement(proposal.id, "rejected"), "Recording explicit owner rejection…", "Rejection could not be recorded. Proposal state was not changed locally.");
      }
      actions.append(accept, reject);
    } else if (proposal.state === "accepted") {
      const convert = el("button", "cc-button brain-improvement__convert", "Create scope request");
      convert.type = "button";
      convert.disabled = !writable;
      if (writable && provider && isBrainConversationRuntimeProvider(provider)) {
        runAction(convert, () => provider.convertBrainImprovementToScopeRequest(proposal), "Creating structured scope request from the verified detail reference/hash…", "Scope request could not be created. The roadmap was not changed.");
      }
      actions.append(convert);
    }
    if (actions.childElementCount) item.append(actions);
    item.append(actionStatus);
    center.append(item);
  }
  return center;
}

function mergeVoiceTranscript(base: string, transcript: string): string {
  const prefix = base.trim();
  const voice = transcript.trim();
  if (!prefix) return voice;
  if (!voice) return prefix;
  return `${prefix}${/[.!?]$/u.test(prefix) ? "" : "."} ${voice}`;
}

function composer(
  snapshot: CommandCenterRuntimeSnapshot,
  provider: RuntimeSnapshotProvider | undefined,
  projectId: string | undefined,
  selected: RuntimeBrainConversation | undefined,
  rerender: () => Promise<void>
): HTMLElement {
  const node = card("brain-composer");
  node.append(el("h2", "section-title", "OWNER INPUT"));
  const writable = !!provider
    && isBrainConversationRuntimeProvider(provider)
    && snapshot.brain?.availability === "available"
    && (snapshot.connection.state === "connected" || snapshot.connection.state === "degraded");
  const form = el("form", "brain-composer__form");
  const input = el("textarea", "cc-input brain-composer__input");
  input.name = "brain-input";
  input.rows = 5;
  input.maxLength = 12000;
  input.placeholder = projectId ? "Ask, decide, research, propose, or steer work for this project…" : "Ask, decide, research, propose, or steer Command Center…";
  input.setAttribute("aria-label", "Brain conversation input");
  input.disabled = !writable;
  const submit = el("button", "cc-button brain-composer__submit", "Persist owner turn");
  submit.type = "submit";
  submit.disabled = !writable;
  const voiceControls = el("div", "brain-voice-controls");
  const voiceButton = el("button", "cc-button cc-button--secondary brain-voice-start", "Use microphone");
  voiceButton.type = "button";
  const cancelVoice = el("button", "cc-button cc-button--secondary brain-voice-cancel", "Cancel voice");
  cancelVoice.type = "button";
  cancelVoice.hidden = true;
  const voiceStatus = el("span", "brain-voice-status muted", "Text input is always available.");
  voiceControls.append(voiceButton, cancelVoice, voiceStatus);
  const message = el("p", "brain-composer__message muted", writable
    ? "This stores an owner conversation turn in the canonical Brain record. Protected-action language is recognized as a request only and cannot bypass Command Center authorization."
    : "Persistent Brain input is unavailable because the authenticated canonical Brain provider is not currently writable. Nothing will be stored locally as a substitute.");
  form.append(input, voiceControls, submit);
  node.append(form, message);

  let voiceCapture: BrowserVoiceCapture | undefined;
  let preVoiceText = "";
  let voiceFinalized = false;
  const voiceRegistry = typeof window !== "undefined" && typeof navigator !== "undefined" ? createDefaultBrowserVoiceRegistry(window, navigator) : undefined;
  const voiceAdapter = voiceRegistry?.firstAvailable();
  voiceButton.disabled = !writable || !voiceAdapter;
  if (!voiceAdapter) voiceStatus.textContent = "Speech provider unavailable. Text input remains available.";

  const finishVoiceUi = (status: string, restore = false): void => {
    if (restore) input.value = preVoiceText;
    voiceCapture = undefined;
    voiceButton.disabled = !writable || !voiceAdapter;
    cancelVoice.hidden = true;
    submit.disabled = !writable;
    voiceStatus.textContent = status;
    input.focus();
  };

  voiceButton.addEventListener("click", () => {
    if (!writable || !voiceAdapter || voiceCapture) return;
    void (async () => {
      preVoiceText = input.value;
      voiceFinalized = false;
      voiceButton.disabled = true;
      cancelVoice.hidden = false;
      submit.disabled = true;
      voiceStatus.textContent = "Requesting microphone permission…";
      try {
        voiceCapture = await voiceAdapter.start({
          partial: (text) => {
            if (voiceFinalized) return;
            input.value = mergeVoiceTranscript(preVoiceText, text);
            voiceStatus.textContent = "Listening… interim transcript is editable only after capture ends.";
          },
          final: (text) => {
            voiceFinalized = true;
            input.value = mergeVoiceTranscript(preVoiceText, text);
            finishVoiceUi("Final transcript ready. Review or edit it before persisting; voice never auto-submits.");
          },
          error: () => {
            finishVoiceUi("Speech provider failed. Original text was restored; text input remains available.", true);
          },
          ended: () => {
            if (!voiceFinalized && voiceCapture) finishVoiceUi("Voice capture ended without a final transcript. Text input remains available.", true);
          }
        });
        if (voiceCapture) voiceStatus.textContent = "Listening… use Cancel voice to discard this capture.";
      } catch {
        finishVoiceUi("Microphone permission or speech provider is unavailable. Text input remains available.", true);
      }
    })();
  });

  cancelVoice.addEventListener("click", () => {
    if (!voiceCapture) return;
    const active = voiceCapture;
    voiceCapture = undefined;
    active.cancel();
    finishVoiceUi("Voice capture cancelled. Original text restored; nothing was submitted.", true);
  });

  if (!writable || !provider || !isBrainConversationRuntimeProvider(provider)) return node;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (voiceCapture) return;
    void (async () => {
      const value = input.value.trim();
      if (!value) return;
      input.disabled = true;
      voiceButton.disabled = true;
      cancelVoice.disabled = true;
      submit.disabled = true;
      submit.textContent = "Persisting…";
      message.textContent = "Persisting through the authenticated canonical Brain RPC…";
      try {
        let conversationId = selected?.id;
        if (!conversationId) {
          const project = projectId ? snapshot.projects.find((candidate) => candidate.id === projectId) : undefined;
          conversationId = await provider.createBrainConversation(projectId, project ? `${project.name} — Brain` : "Command Center Brain");
        }
        await provider.recordBrainOwnerTurn(conversationId, value);
        window.history.replaceState({}, "", brainHref(projectId, conversationId));
        await rerender();
      } catch {
        input.disabled = false;
        voiceButton.disabled = !voiceAdapter;
        cancelVoice.disabled = false;
        submit.disabled = false;
        submit.textContent = "Persist owner turn";
        message.textContent = "Brain input could not be persisted. No protected action was executed and no local substitute record was created.";
      }
    })();
  });
  return node;
}

export function renderBrainView(snapshot: CommandCenterRuntimeSnapshot, provider: RuntimeSnapshotProvider | undefined, rerender: () => Promise<void>): HTMLElement {
  const section = el("section", "screen-stack brain-screen");
  const brain = snapshot.brain;
  if (!brain) {
    section.append(emptyState("Brain unavailable", "The current runtime provider does not expose the durable Category 6 Brain conversation/workspace contract. Generic surface status is not substituted for conversation state.", snapshot.connection.state));
    return section;
  }
  if (brain.availability !== "available") {
    section.append(emptyState("Brain unavailable", "Canonical Brain conversation/workspace state could not be loaded. No conversation history or write capability is inferred.", brain.availability));
    return section;
  }

  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("project")?.trim() || undefined;
  const requestedConversationId = params.get("conversation")?.trim() || undefined;
  const forceNew = params.get("new") === "1";
  const project = projectId ? snapshot.projects.find((candidate) => candidate.id === projectId) : undefined;
  if (projectId && !project) {
    section.append(emptyState("Project context unavailable", "The requested Brain project is not present in the current canonical project snapshot. Brain will not silently switch projects.", "unavailable"));
    return section;
  }

  const scopedConversations = projectId ? brain.conversations.filter((conversation) => conversation.projectId === projectId) : brain.conversations;
  const workspace = projectId ? brain.workspaces.find((candidate) => candidate.projectId === projectId) : undefined;
  const workspaceConversationId = workspace?.conversationId.state === "known" ? workspace.conversationId.value : undefined;
  const selected = forceNew
    ? undefined
    : requestedConversationId
      ? scopedConversations.find((conversation) => conversation.id === requestedConversationId)
      : workspaceConversationId
        ? scopedConversations.find((conversation) => conversation.id === workspaceConversationId)
        : scopedConversations.find((conversation) => conversation.state === "active") ?? scopedConversations[0];

  const overview = card("brain-overview");
  const overviewHeading = el("div", "brain-card__heading");
  overviewHeading.append(el("h2", "section-title", "BRAIN"), pill("CANONICAL", "available"));
  overview.append(
    overviewHeading,
    el("p", "brain-overview__scope", project ? `Project context: ${project.name}` : "Command Center-wide intelligence context"),
    el("p", "muted", `${brain.conversations.length} persistent conversation${brain.conversations.length === 1 ? "" : "s"} · ${brain.workspaces.length} durable project workspace${brain.workspaces.length === 1 ? "" : "s"} · ${brain.improvements.length} evidence-backed improvement proposal${brain.improvements.length === 1 ? "" : "s"}. Conversation itself never grants protected-action authority.`)
  );
  const actions = el("div", "brain-overview__actions");
  if (project) actions.append(routeLink("Back to project", `/project/${encodeURIComponent(project.id)}`, "cc-button cc-button--secondary", rerender));
  if (selected || scopedConversations.length > 0) actions.append(routeLink("New conversation", brainHref(projectId, undefined, true), "cc-button", rerender));
  overview.append(actions);
  section.append(overview, improvementsCenter(brain.improvements, projectId, provider, rerender));

  if (requestedConversationId && !selected && !forceNew) {
    section.append(emptyState("Conversation scope mismatch", "The requested conversation is not available inside the current project scope. Command Center did not substitute another conversation.", "unavailable"));
  }

  const layout = el("div", "brain-layout");
  layout.append(conversationList(scopedConversations, selected?.id, projectId, rerender));
  const main = el("div", "brain-main");
  if (projectId) main.append(workspaceCard(workspace));
  main.append(conversationPanel(selected), composer(snapshot, provider, projectId, selected, rerender));
  layout.append(main);
  section.append(layout);
  return section;
}
