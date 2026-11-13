import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { act } from 'react';
import { ApolloPuzzle, OpportunityCaptionPuzzle, OpportunityEvidencePuzzle } from '../puzzles/Investigations';

afterEach(() => vi.useRealTimers());
const button = (name: string | RegExp) => screen.getByRole('button', { name });
const click = (name: string | RegExp) => fireEvent.click(button(name));

it('requires both Apollo stages and the correct reason to restore the record', () => {
  const complete = vi.fn();
  render(<ApolloPuzzle onComplete={complete} />);
  click('Ascent stage');
  expect(screen.getByRole('status')).toHaveTextContent('platform');
  expect(complete).not.toHaveBeenCalled();
  click('Descent stage');
  click('Inspect upper stage');
  expect(button(/continue to the explanation/i)).toBeDisabled();
  click('Inspect lower stage');
  click(/continue to the explanation/i);
  click('It was forgotten by the astronauts.');
  expect(screen.getByRole('status')).toHaveTextContent('worked together');
  click(/landing platform; the ascent stage/i);
  click('Restore the record');
  expect(complete).toHaveBeenCalledOnce();
});

it('allows an incorrect trail to be reordered and rejects a claim of life', () => {
  const complete = vi.fn();
  render(<OpportunityEvidencePuzzle onComplete={complete} />);
  click('Select The final traverse'); click(/^Slot 1/);
  click('Select Eagle Crater'); click(/^Slot 2/);
  click('Select Clues in the rocks'); click(/^Slot 3/);
  click('Check the trail');
  expect(screen.getByRole('status')).toHaveTextContent('out of order');
  click('Check the trail');
  expect(button('Show me the explanation')).toBeVisible();
  click('Select Eagle Crater'); click(/^Slot 1/);
  click('Select Clues in the rocks'); click(/^Slot 2/);
  click('Check the trail');
  click('Living animals on Mars');
  expect(screen.getByRole('status')).toHaveTextContent('ancient environments');
  expect(complete).not.toHaveBeenCalled();
  click('Past water-related conditions on Mars');
  click('Restore the record');
  expect(complete).toHaveBeenCalledOnce();
});

it('offers a caption explanation after 30 seconds without advancing on its own', () => {
  vi.useFakeTimers();
  const complete = vi.fn();
  render(<OpportunityCaptionPuzzle onComplete={complete} />);
  click('Opportunity failed after just 90 days.');
  expect(screen.getByRole('status')).toHaveTextContent('nearly 15 Earth years');
  expect(screen.queryByRole('button', { name: 'Show me the explanation' })).toBeNull();
  act(() => vi.advanceTimersByTime(30_000));
  click('Show me the explanation');
  expect(complete).not.toHaveBeenCalled();
  click('Restore the record');
  expect(complete).toHaveBeenCalledOnce();
});
