/**
 * PetPal on-device demo answerer — kind, rule-based pet-care answers
 * used when the /api/ask endpoint is not configured (no Gemini key).
 * Every answer is labelled DEMO in the UI and ends with the same
 * "not veterinary advice" line the live service uses.
 *
 * The answerer never diagnoses an illness and never prescribes medicine
 * or a dose. Anything that could be serious points at the vet.
 */

export const DEMO_DISCLAIMER =
  'This is general pet-care information, not veterinary advice. Please ask your vet about your pet.';

export interface DemoAnswer {
  answer: string;
  /** Which rule matched — shown nowhere in the UI, used by tests. */
  topic: string;
}

const FALLBACK_TOPIC = 'general';

function withDisclaimer(body: string): string {
  return `${body}\n\n${DEMO_DISCLAIMER}`;
}

const RULES: { topic: string; match: RegExp; answer: (petName: string) => string }[] = [
  {
    topic: 'feeding',
    match: /feed|food|eat|hungry|kibble|portion|how much.*(food|eat)|meal|treat/i,
    answer: (petName) =>
      withDisclaimer(
        `Feeding ${petName} is mostly about routine and the right amount for their size. Feed measured meals at the same times each day rather than leaving a full bowl out, keep fresh water available at all times, and go by the feeding guide on your pet food bag for their weight, then adjust slowly if they gain or lose weight. Treats should stay under about a tenth of the day's food. If ${petName} suddenly stops eating for more than a day, that is worth a call to your vet.`,
      ),
  },
  {
    topic: 'exercise',
    match: /walk|exercise|play|energy|run|active|tired|bored|zoom/i,
    answer: (petName) =>
      withDisclaimer(
        `Most pets do best with a little movement every day, split into short sessions rather than one long burst. For ${petName}, a morning walk or play session and a shorter one in the evening is a good rhythm, with puzzle toys or a feather wand on days you stay inside. Watch their breathing and energy: slowing down, lagging behind, or heavy panting means it is time to rest and head home.`,
      ),
  },
  {
    topic: 'vomiting',
    match: /vomit|throwing up|diarrh|loose stool|upset stomach|sick.*(stomach|tummy)|poo|poop/i,
    answer: (petName) =>
      withDisclaimer(
        `A single upset stomach can follow a sudden food change or something they scavenged, but it is not something to guess at. Keep ${petName} comfortable, offer small amounts of fresh water, skip one meal, and then offer a small bland meal if they seem settled. Call your vet promptly if the vomiting or diarrhea repeats, if there is blood, if they are very sleepy or will not drink, or if it lasts more than a day.`,
      ),
  },
  {
    topic: 'ticks-fleas',
    match: /tick|flea|itch|scratch|parasite|mite|flea/i,
    answer: (petName) =>
      withDisclaimer(
        `Itching and tiny dark specks in the fur are the usual first signs of fleas, and ticks are most often found around the ears, neck, and belly after time outdoors. Check ${petName} with your fingers against the fur after walks, wash their bedding regularly, and vacuum sleeping areas. For prevention or treatment, use only a product your vet has recommended for your pet's species, age, and weight, and never use a dog product on a cat.`,
      ),
  },
  {
    topic: 'new-pet',
    match: /new pet|just (got|adopted|brought)|settling|first (day|week)|new (dog|cat|bird|puppy|kitten)|adopt/i,
    answer: (petName) =>
      withDisclaimer(
        `The first days are about letting ${petName} set the pace. Give them one quiet room with food, water, a bed, and a hiding spot, keep visitors and noise low, and stick to the same feeding and walk times from day one. Short, calm introductions to each family member beat one big hello, and a vet visit in the first week is a good way to start their health record.`,
      ),
  },
  {
    topic: 'grooming',
    match: /groom|brush|bath|nail|claw|fur|shedd|teeth|dental/i,
    answer: (petName) =>
      withDisclaimer(
        `A little regular grooming keeps ${petName} comfortable and lets you spot problems early. Brush a few minutes a few times a week, trim nails a little at a time and stop before the quick, and bathe only when they are actually dirty, using a pet shampoo. While you groom, check ears, paws, and skin for redness, lumps, or anything new, and ask your vet about anything that looks sore.`,
      ),
  },
  {
    topic: 'vaccine',
    match: /vaccin|shot|booster|rabies|immun/i,
    answer: (petName) =>
      withDisclaimer(
        `Vaccines are scheduled by your vet for ${petName}'s species, age, and lifestyle, so the dates in PetPal's Health tab are reminders, not medical orders. Puppies and kittens usually need a series in their first months, then boosters on the schedule your vet sets. If a vaccine date has passed, call your vet to rebook rather than waiting for the next visit.`,
      ),
  },
  {
    topic: 'weight',
    match: /weight|fat|skinny|overweight|obese|thin|diet/i,
    answer: (petName) =>
      withDisclaimer(
        `You should be able to feel ${petName}'s ribs easily under a thin layer of fat and see a waist from above and from the side. The weight log in PetPal's Health tab makes slow changes visible, which is exactly what matters. If the number is climbing or falling steadily, talk to your vet about the right daily amount before cutting food, since sudden diet changes can be harmful.`,
      ),
  },
];

/** Answer a question on-device. Never diagnoses, never prescribes. */
export function demoAnswer(question: string, petName = 'your pet'): DemoAnswer {
  const q = question.trim();
  for (const rule of RULES) {
    if (rule.match.test(q)) {
      return { answer: rule.answer(petName), topic: rule.topic };
    }
  }
  return {
    answer: withDisclaimer(
      `That is a good question to ask about ${petName}, and I do not have a safe, specific answer for it in demo mode. For anything about health, behaviour, or food, the safest step is to ask your vet, who knows ${petName}'s history. In the meantime, keep their routine steady: regular meals, fresh water, play, and rest.`,
    ),
    topic: FALLBACK_TOPIC,
  };
}

/** Suggested starter questions shown on the Ask screen. */
export const SUGGESTED_QUESTIONS: { label: string; question: string }[] = [
  { label: 'How much should I feed them?', question: 'How much food should I feed my pet each day?' },
  { label: 'How much exercise do they need?', question: 'How much exercise does my pet need every day?' },
  { label: 'My pet vomited once', question: 'My pet vomited once, what should I do first?' },
  { label: 'Ticks and fleas', question: 'How do I check my pet for ticks and fleas?' },
  { label: 'Settling in a new pet', question: 'We just adopted a new pet, how do we help them settle in?' },
];
