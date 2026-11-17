// Canned assistant replies. Nothing here talks to a model: the app picks a
// reply by keyword and "streams" it word by word to show the UI pattern.

export const models = [
  { value: 'quill-swift', label: 'Quill Swift', caption: 'Quick, concise answers', msPerWord: 28 },
  { value: 'quill-deep', label: 'Quill Deep', caption: 'Slower, more considered', msPerWord: 70 },
  { value: 'quill-mini', label: 'Quill Mini', caption: 'Fastest, lightest', msPerWord: 14 },
] as const;

export type ModelId = (typeof models)[number]['value'];

export const findModel = (id: string) => models.find((m) => m.value === id) ?? models[0];

export const suggestions = [
  'Plan a calmer week around two deadlines',
  'How does this demo work?',
  'Write a haiku about shipping on a Friday',
];

const replies = {
  plan: `Here's a calmer shape for the week, built around protecting your best hours.

Monday and Tuesday: put the harder deadline first. Block 9–12 both mornings for deep work, and keep meetings to the afternoon.

Wednesday: a buffer day. Review what slipped, answer the messages you've been parking, and take a proper lunch.

Thursday: the second deadline. You'll be warmed up from Monday, so aim to finish by mid-afternoon.

Friday: no new work. Tidy up, write down what you learned, and leave early if you can.

Want me to turn this into calendar blocks?`,

  demo: `This is a sample app. The replies are pre-written and typed out word by word to imitate streaming.

The layout uses q-layout with a q-drawer for the conversation list, which collapses on narrow screens. Conversations are saved in your browser's localStorage.`,

  haiku: `Green checks at four-oh-five,
the deploy bar inches on.
Weekend holds its breath.

Want another one, slightly less nervous?`,

  email: `Here's a short, friendly draft:

Hi Sam, thanks for sending this over. I've read through it and I'm happy with the direction. Two small things: could we move the review to Thursday, and keep the scope to the first phase for now? Everything else looks good to go.

Best,
Alex

I kept it brief and put the two asks in one sentence so they're easy to say yes to.`,

  generic: [
    `That's a good question to sit with for a moment.

The short answer: start with the smallest version that would actually be useful to you this week, use it for a few days, and let what annoys you decide what to build next.

I'm a simulated assistant in a demo, so this reply is canned, but the streaming, stop button and copy action work the way a real one would.`,
    `Let me think about that out loud.

There are usually two paths: do the thing properly once, or do it quickly now and come back later. If it is something you will touch every day, the first is cheaper in the long run. If you're still exploring, the second is kinder.

(Replies here are pre-written; try asking about planning your week, a haiku, an email, or how this demo works.)`,
  ],
};

export function pickReply(prompt: string, turn: number): string {
  const p = prompt.toLowerCase();
  if (/plan|week|schedule|deadline|calendar/.test(p)) return replies.plan;
  if (/haiku|poem|verse/.test(p)) return replies.haiku;
  if (/email|e-mail|reply to|draft/.test(p)) return replies.email;
  if (/demo|quasar|how does this/.test(p)) return replies.demo;
  return replies.generic[turn % replies.generic.length]!;
}
