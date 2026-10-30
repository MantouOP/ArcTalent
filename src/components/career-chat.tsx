'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  LoaderCircle,
  MessageCircle,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import {
  answerCareerQuestion,
  careerChatContextKey,
  type ChatContext,
  type ChatLine,
  type ChatReply,
  type ChatView,
} from '@/lib/career-chat';
import type { TranslationValues } from '@/lib/i18n';
import { roleLabel } from '@/lib/role-label';
import { makeChatRequest } from '@/lib/career-chat-request';
import type { CareerChatAnswer } from '@/lib/career-chat-ai';
import type { CareerGoal } from '@/lib/types';
import { useI18n } from './language-provider';
import './career-chat.css';

type Turn = {
  id: number;
  question: string;
  reply: ChatReply;
  contextKey: string;
  mode?: 'ai' | 'local';
  model?: string;
  notice?: string;
};
const prompts = [
  'Why this career?',
  'What should I learn first?',
  'Show my skill gaps',
  'Compare AI scenarios',
  'Can I afford my plan?',
  'Where does the evidence come from?',
];

export function CareerChat({
  context,
  onNavigate,
  customGoal,
  funding,
}: {
  context: ChatContext;
  onNavigate: (view: ChatView) => void;
  customGoal: CareerGoal | null;
  funding: 'all' | 'free' | 'hrd';
}) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [error, setError] = useState('');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [availability, setAvailability] = useState<
    'checking' | 'configured' | 'local'
  >('checking');
  const [pending, setPending] = useState(false);
  const request = useRef<AbortController | null>(null);
  const nextId = useRef(0);
  const launcher = useRef<HTMLButtonElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const headingId = useId();
  const helpId = useId();
  const contextKey = useMemo(() => careerChatContextKey(context), [context]);
  const hasEarlierContext = turns.some(
    (turn) => turn.contextKey !== contextKey,
  );

  useEffect(() => {
    if (open) composer.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    if (!open || availability !== 'checking') return;
    const controller = new AbortController();
    fetch('/api/health', {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]),
      cache: 'no-store',
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) =>
        setAvailability(
          data.careerChat === 'runpod-configured' ? 'configured' : 'local',
        ),
      )
      .catch(() => {
        if (!controller.signal.aborted) setAvailability('local');
      });
    return () => controller.abort();
  }, [open, availability]);
  useEffect(() => {
    request.current?.abort();
    request.current = null;
    setPending(false);
  }, [contextKey, locale]);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (open && transcript.current)
      transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [open, turns, locale, pending]);

  function close() {
    setOpen(false);
    launcher.current?.focus({ preventScroll: true });
  }
  async function send(question = draft, lookup = question) {
    const text = question.trim();
    if (!text || text.length > 600 || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setError('');
    setPending(aiEnabled);
    try {
      let reply = answerCareerQuestion(
        lookup,
        context,
        turns.at(-1)?.reply.intent,
      );
      let result: Pick<CareerChatAnswer, 'mode' | 'notice' | 'model'> = {
        mode: 'local',
        notice: '',
      };
      if (aiEnabled) {
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(55000),
            ]),
            body: JSON.stringify(
              makeChatRequest(text, locale, context, {
                customGoal,
                funding,
                history: turns
                  .filter((turn) => turn.contextKey === contextKey)
                  .slice(-4)
                  .map((turn) => ({
                    question: turn.question,
                    answer: [...turn.reply.paragraphs, ...turn.reply.bullets]
                      .map(line)
                      .join('\n')
                      .slice(0, 1800),
                  })),
              }),
            ),
          });
          if (!response.ok) throw new Error('Chat request failed');
          const data: CareerChatAnswer = await response.json();
          if (data.mode !== 'ai' && data.mode !== 'local')
            throw new Error('Invalid chat reply');
          if (data.mode === 'ai') reply = data.reply;
          result = { mode: data.mode, notice: data.notice, model: data.model };
        } catch {
          if (controller.signal.aborted) return;
          result = {
            mode: 'local',
            notice:
              'AI is unavailable right now. This reply uses the local planning guide.',
          };
        }
      }
      if (controller.signal.aborted || request.current !== controller) return;
      const turn = {
        id: ++nextId.current,
        question: text,
        reply,
        contextKey,
        ...result,
      };
      setTurns((previous) => [...previous.slice(-19), turn]);
      setDraft('');
      setError('');
    } catch {
      setError('Could not prepare a reply. Try a suggested question.');
    } finally {
      if (request.current === controller) {
        request.current = null;
        setPending(false);
      }
    }
    composer.current?.focus({ preventScroll: true });
  }
  function line(value: ChatLine) {
    const values: TranslationValues = {};
    for (const [key, token] of Object.entries(value.values ?? {}))
      values[key] = typeof token === 'object' ? t(token.label) : token;
    return t(value.text, values);
  }

  return (
    <div className="career-chat-widget">
      <section
        className="career-chat-panel"
        id={panelId}
        role="dialog"
        aria-modal="false"
        aria-labelledby={headingId}
        hidden={!open}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
            event.stopPropagation();
            close();
          }
        }}
      >
        <header className="career-chat-header">
          <span className="career-chat-mark">
            <MessageCircle size={19} />
          </span>
          <div>
            <h2 id={headingId}>{t('ArcTalent Guide')}</h2>
            <p>
              {t(
                aiEnabled
                  ? 'AI-assisted guide · RunPod'
                  : 'Plan-based guide · On this device',
              )}
            </p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label={t('Clear conversation')}
            title={t('Clear conversation')}
            disabled={!turns.length && !draft && !pending}
            onClick={() => {
              request.current?.abort();
              request.current = null;
              setPending(false);
              setTurns([]);
              setDraft('');
              setError('');
              composer.current?.focus();
            }}
          >
            <Trash2 size={16} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={t('Close career assistant')}
            onClick={close}
          >
            <X size={18} />
          </button>
        </header>
        <div className="career-chat-context">
          <span>{t('Selected worker route')}</span>
          <strong>{roleLabel(context.active.role, t, true)}</strong>
        </div>
        <div className="career-chat-mode">
          <label>
            <input
              type="checkbox"
              checked={aiEnabled}
              disabled={availability !== 'configured'}
              onChange={(event) => {
                request.current?.abort();
                request.current = null;
                setPending(false);
                setAiEnabled(event.target.checked);
              }}
            />
            {t('Use AI answers (RunPod)')}
          </label>
          <p>
            {t(
              availability === 'checking'
                ? 'Checking AI configuration…'
                : availability === 'configured'
                  ? 'When enabled, your question, recent same-plan chat, skills, selected goal, time and budget are sent to RunPod. CV text, names, photos and team records are not included. ArcTalent does not save the chat on its server.'
                  : 'AI is not connected. You can still ask the local planning guide.',
            )}
          </p>
        </div>
        {hasEarlierContext && (
          <p className="career-chat-change" role="status">
            {t(
              'Your plan changed. New replies use the current plan; earlier replies keep their original context.',
            )}
          </p>
        )}
        <div
          className="career-chat-transcript"
          ref={transcript}
          role="log"
          aria-label={t('Career conversation')}
          aria-live="polite"
          aria-relevant="additions"
        >
          {!turns.length && (
            <div className="career-chat-intro">
              <h3>{t('A clearer next step starts with a question.')}</h3>
              <p>
                {t(
                  'Ask about your selected career, transferable skills, course plan, time, budget or the evidence behind it.',
                )}
              </p>
              <p className="career-chat-scope">
                {t(
                  aiEnabled
                    ? 'AI answers can be mistaken. Check the course sources and review suggestions before acting.'
                    : 'I explain ArcTalent’s planning model. I do not predict hiring outcomes or answer every general question.',
                )}
              </p>
            </div>
          )}
          {turns.map((turn) => (
            <article className="career-chat-turn" key={turn.id}>
              <div className="career-chat-question">
                <span className="sr-only">{t('You')}</span>
                <p>{turn.question}</p>
              </div>
              <div className="career-chat-answer">
                <span className="career-chat-speaker">
                  {turn.mode === 'ai'
                    ? `${t('AI answer')} · ${turn.model ?? 'RunPod'}`
                    : t('Local planning guide')}
                </span>
                {turn.notice && (
                  <p className="career-chat-notice">{t(turn.notice)}</p>
                )}
                {turn.reply.paragraphs.map((paragraph, i) => (
                  <p key={i}>{line(paragraph)}</p>
                ))}
                {turn.reply.bullets.length > 0 && (
                  <ul>
                    {turn.reply.bullets.map((bullet, i) => (
                      <li key={i}>{line(bullet)}</li>
                    ))}
                  </ul>
                )}
                {turn.reply.sources.length > 0 && (
                  <div className="career-chat-sources">
                    <span>{t('Sources')}</span>
                    {turn.reply.sources.map((source, i) => (
                      <a
                        key={i}
                        href={source.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {source.courseTitle ?? t(source.label)}
                        <ArrowUpRight size={12} />
                      </a>
                    ))}
                  </div>
                )}
                {turn.reply.action && (
                  <button
                    type="button"
                    className="career-chat-action"
                    onClick={() => {
                      onNavigate(turn.reply.action!.view);
                      close();
                    }}
                  >
                    {t(turn.reply.action.label)}
                    <ArrowUpRight size={13} />
                  </button>
                )}
                <small className="career-chat-basis">
                  {t('Based on {0} · {1} · {2}', {
                    0: turn.reply.basis.custom
                      ? turn.reply.basis.role
                      : t(turn.reply.basis.role),
                    1: t(turn.reply.basis.scenario),
                    2: t(turn.reply.basis.snapshot),
                  })}
                </small>
              </div>
            </article>
          ))}
          {pending && (
            <p className="career-chat-pending" role="status">
              <LoaderCircle size={14} />
              {t('Preparing an AI answer…')}
            </p>
          )}
          <div
            className="career-chat-prompts"
            aria-label={t('Suggested questions')}
          >
            {(turns.length ? prompts.slice(0, 4) : prompts).map((prompt) => (
              <button
                type="button"
                key={prompt}
                disabled={pending}
                onClick={() => send(t(prompt), prompt)}
              >
                {t(prompt)}
              </button>
            ))}
          </div>
          {turns.length >= 20 && (
            <p className="career-chat-limit">
              {t('Showing the latest 20 questions in this tab.')}
            </p>
          )}
        </div>
        <form
          className="career-chat-composer"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          {error && (
            <p className="career-chat-error" role="alert">
              {t(error)}
            </p>
          )}
          <div className="career-chat-input-row">
            <textarea
              ref={composer}
              value={draft}
              maxLength={600}
              disabled={pending}
              rows={2}
              autoComplete="off"
              enterKeyHint="send"
              aria-label={t('Ask a career or learning question')}
              aria-describedby={helpId}
              placeholder={t('Ask about your next step…')}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  send();
                }
              }}
            />
            <button
              type="submit"
              className="career-chat-send"
              aria-label={t('Send question')}
              disabled={!draft.trim() || pending}
            >
              {pending ? <LoaderCircle size={17} /> : <Send size={17} />}
            </button>
          </div>
          <p id={helpId}>{t('Enter to send · Shift+Enter for a new line')}</p>
          <small>
            {t('Conversation stays in this tab. Clear it anytime.')}
          </small>
        </form>
      </section>
      <button
        ref={launcher}
        type="button"
        className="career-chat-launcher"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t(
          open ? 'Close career assistant' : 'Open career assistant',
        )}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
        <span>{t(open ? 'Close guide' : 'Ask ArcTalent')}</span>
      </button>
    </div>
  );
}
