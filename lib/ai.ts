import { API_BASE } from './config';
import { demoAnswer } from './demoai';
import type { Pet } from './types';

/**
 * Client for the PetPal backend (Python serverless): POST /api/ask.
 * Every call is labelled honestly: 'live' when the endpoint answers,
 * 'demo' when the on-device answerer does the work instead.
 */

async function postJson(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Backend answered ${res.status}`);
  return res.json() as Promise<unknown>;
}

export interface AskResult {
  answer: string;
  /** 'live' when the endpoint answered, 'demo' for the on-device answerer. */
  source: 'live' | 'demo';
}

/** Ask about a pet — live service when configured, demo answerer otherwise. */
export async function askAboutPet(question: string, pet: Pet | null): Promise<AskResult> {
  const petName = pet?.name ?? 'your pet';
  try {
    const data = (await postJson('/api/ask', {
      question,
      pet: pet ? { name: pet.name, species: pet.species } : null,
    })) as { answer?: string };
    if (data.answer) return { answer: data.answer, source: 'live' };
    throw new Error('Empty answer');
  } catch {
    return { answer: demoAnswer(question, petName).answer, source: 'demo' };
  }
}
