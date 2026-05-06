import { useCallback, useEffect, useMemo, useState } from 'react';
import { transformApiData, trialResultsApi } from '@/api';
import type { StudentTrial, TrialResult } from '@/types';

/**
 * Loads trial results for the given completed trials and exposes a manual
 * loader for not-yet-completed trials (e.g. when opening the result editor).
 */
export function useTrialResults(completedTrials: StudentTrial[]) {
  const [results, setResults] = useState<Record<string, TrialResult | undefined>>({});

  const completedTrialsKey = useMemo(
    () =>
      completedTrials
        .map(
          (trial) =>
            `${trial.id}:${new Date(trial.updatedAt ?? trial.completedAt ?? trial.createdAt).getTime()}`,
        )
        .join('|'),
    [completedTrials],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const completedSnapshot = useMemo(() => completedTrials, [completedTrialsKey]);

  useEffect(() => {
    if (completedSnapshot.length === 0) {
      setResults({});
      return;
    }

    let cancelled = false;

    (async () => {
      const entries = await Promise.all(
        completedSnapshot.map(async (trial) => {
          try {
            const dto = await trialResultsApi.getByStudentTrial(trial.id);
            return dto ? ([trial.id, transformApiData.trialResult(dto)] as const) : null;
          } catch (error) {
            console.error('Ошибка при загрузке результата пробника:', error);
            return null;
          }
        }),
      );

      if (cancelled) return;

      const next: Record<string, TrialResult> = {};
      entries.forEach((entry) => {
        if (entry) next[entry[0]] = entry[1];
      });
      setResults(next);
    })();

    return () => {
      cancelled = true;
    };
    // completedTrialsKey is the stable invalidator
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedTrialsKey]);

  /** Lazily fetch a single trial's result if not in cache. */
  const ensureLoaded = useCallback(
    async (trialId: string) => {
      if (results[trialId]) return;
      try {
        const dto = await trialResultsApi.getByStudentTrial(trialId);
        if (dto) {
          setResults((prev) => ({ ...prev, [trialId]: transformApiData.trialResult(dto) }));
        }
      } catch (error) {
        console.error('Ошибка при загрузке результата пробника:', error);
      }
    },
    [results],
  );

  return { results, ensureLoaded };
}
