export const STIM_TIMELINE = [
  { range: [1,  2],  label: 'Days 1–2: Baseline ultrasound + bloodwork, start stims' },
  { range: [3,  5],  label: 'Days 3–5: Continue stims, monitoring begins' },
  { range: [6,  8],  label: 'Days 6–8: More monitoring, possible dose adjustments' },
  { range: [9,  11], label: 'Days 9–11: Trigger shot window' },
  { range: [12, 13], label: 'Retrieval + 1–2 days after: Recovery + results' },
];

export const DAY_CONTENT = {
  '1': {
    expectTitle: "You're getting your baseline — and starting strong.",
    expectBody: "Today is about baseline ultrasound + bloodwork, then starting stimulation meds. Focus on staying hydrated and getting your routine set up.",
    questions: [
      "Are my baseline labs/ultrasound in the expected range to start stims?",
      "What time should I take my meds each day?",
      "When is my next monitoring appointment?",
    ],
  },
  '2': {
    expectTitle: "Settling into stims — keep it consistent.",
    expectBody: "Continue stims. Consistency matters more than perfection. Note any early side effects and keep injection timing steady.",
    questions: [
      "Should we adjust anything based on how I'm tolerating meds?",
      "What symptoms are normal vs. worth calling about?",
      "Do you expect monitoring to start tomorrow or day 3?",
    ],
  },
  '3': {
    expectTitle: "Monitoring begins — data starts to guide the plan.",
    expectBody: "You'll likely start monitoring (ultrasound + bloodwork) around this window. The goal is to track follicle growth and hormone response.",
    questions: [
      "How many follicles are developing and what sizes?",
      "Is my E2 rising as expected?",
      "Any dose adjustments needed yet?",
    ],
  },
  '7': {
    expectTitle: "More monitoring — dose tweaks are common.",
    expectBody: "This is the phase where monitoring becomes frequent and dose adjustments can happen. Your job is to show up + track how you feel.",
    questions: [
      "Are we on track with growth rates?",
      "Do we need to change dosing based on labs?",
      "When do you anticipate starting/continuing antagonist (if applicable)?",
    ],
  },
  '10': {
    expectTitle: "Trigger window — timing gets precise.",
    expectBody: "You're in the trigger window. Timing can be exact; confirm trigger instructions and retrieval timing.",
    questions: [
      "When exactly do I trigger and with what dose?",
      "When is retrieval scheduled relative to trigger?",
      "What should I do the day before retrieval?",
    ],
  },
};

export function timelineForDay(day) {
  const d = Number(day);
  const seg = STIM_TIMELINE.find(s => d >= s.range[0] && d <= s.range[1]);
  return seg ? seg.label : '';
}

export function contentForDay(day) {
  const d = Number(day);
  if (DAY_CONTENT[String(d)]) return DAY_CONTENT[String(d)];
  if (d >= 1  && d <= 2)  return DAY_CONTENT['1'];
  if (d >= 3  && d <= 5)  return DAY_CONTENT['3'];
  if (d >= 6  && d <= 8)  return DAY_CONTENT['7'];
  if (d >= 9  && d <= 11) return DAY_CONTENT['10'];
  return {
    expectTitle: "Recovery + results — be gentle with yourself.",
    expectBody: "You're in retrieval/recovery territory. Prioritize rest, hydration, and follow your clinic's instructions.",
    questions: [
      "When will I get fertilization and embryo updates (if applicable)?",
      "What symptoms after retrieval are normal vs urgent?",
      "When can I resume exercise and normal activities?",
    ],
  };
}
