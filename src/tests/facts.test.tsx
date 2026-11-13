import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { ArtifactCard } from '../components/Archive';
import { Media } from '../components/Media';
import { assets } from '../content/assets';
import { missions } from '../content/missions';
import { references } from '../content/references';
import { scenes } from '../content/scenes';

it('registers all scene images and resolves all mission and scene source IDs', () => {
  Object.values(scenes).forEach(scene => expect(assets[scene.backgroundAssetId]).toBeDefined());
  const ids = [...Object.values(missions).flatMap(mission => mission.sourceIds), ...Object.values(scenes).flatMap(scene => scene.sourceIds ?? [])];
  ids.forEach(id => {
    const url = references[id as keyof typeof references][1];
    expect(new URL(url).hostname).toMatch(/(^|\.)nasa\.gov$/);
  });
  for (const asset of Object.values(assets)) {
    expect(asset.credit).toBeTruthy();
    expect(asset.alt).toBeTruthy();
    if (asset.kind === 'nasa-photo') {
      expect(asset.sourceUrl).toContain('nasa.gov');
      expect(asset.usageReviewed).toBe(true);
    }
  }
});

it('shows dated Opportunity status and original source access without restoration', () => {
  render(<ArtifactCard id="opportunity" restored={false} />);
  expect(screen.getByText(/February 13, 2019/)).toBeVisible();
  expect(screen.getByText(/June 10, 2018/)).toBeVisible();
  expect(screen.getByText(/45.16 km/)).toBeVisible();
  expect(screen.queryByText('Restored')).toBeNull();
  expect(screen.getByText('Opportunity mission record').closest('a')).toHaveAttribute('href', references.N4[1]);
});

it('retains the original credit and source when an archival image fails', () => {
  render(<Media id="last-image" />);
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByText('Image unavailable')).toBeVisible();
  expect(screen.getByText(/NASA\/JPL-Caltech\/Cornell\/ASU/)).toBeVisible();
  expect(screen.getByRole('link', { name: 'Original' })).toHaveAttribute('href', references.N6[1]);
});
