'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, MessageCircle, Send, Trash2, X } from 'lucide-react';
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
import { useI18n } from './language-provider';
import './career-chat.css';

type Turn = {
  id: number;
  question: string;
  reply: ChatReply;
  contextKey: string;
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
}: {
  context: ChatContext;
  onNavigate: (view: ChatView) => void;
}) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [error, setError] = useState('');
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
    if (open && transcript.current)
      transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [open, turns, locale]);

  function close() {
    setOpen(false);
    launcher.current?.focus({ preventScroll: true });
  }
  function send(question = draft, lookup = question) {
    const text = question.trim();
    if (!text || text.length > 600) return;
    try {
      const reply = answerCareerQuestion(
        lookup,
        context,
        turns.at(-1)?.reply.intent,
      );
      const turn = { id: ++nextId.current, question: text, reply, contextKey };
      setTurns((previous) => [...previous.slice(-19), turn]);
      setDraft('');
      setError('');
    } catch {
      setError('Could not prepare a reply. Try a suggested question.');
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
            <p>{t('Plan-based guide · On this device')}</p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label={t('Clear conversation')}
            title={t('Clear conversation')}
            disabled={!turns.length && !draft}
            onClick={() => {
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
                  'I explain ArcTalent’s planning model. I do not predict hiring outcomes or answer every general question.',
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
                  {t('ArcTalent Guide')}
                </span>
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
          <div
            className="career-chat-prompts"
            aria-label={t('Suggested questions')}
          >
            {(turns.length ? prompts.slice(0, 4) : prompts).map((prompt) => (
              <button
                type="button"
                key={prompt}
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
              disabled={!draft.trim()}
            >
              <Send size={17} />
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
