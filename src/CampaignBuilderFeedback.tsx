import { Grid, makeStyles, Typography } from '@material-ui/core';
import ThumbDownIcon from '@material-ui/icons/ThumbDown';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import { isEmpty } from 'lodash';
import { DateTime } from 'luxon';
import React, { Dispatch, FC, useCallback, useContext, useEffect, useReducer, useState } from 'react';

import { logger } from '../../utils/Logger';
import Loading from '../common/Loading';
import { removeArrayDuplicates } from './utilities';

type FeedbackState = {
  mutationsInFlight: string[];
  mutationsFailed: string[];
  lastSaveFinished?: DateTime;
};
type FeedbackAction =
  | { type: 'registerInFlightMutation'; mutationName: string }
  | { type: 'deregisterInFlightMutation'; mutationName: string }
  | { type: 'registerFailedMutation'; mutationName: string }
  | { type: 'deregisterFailedMutation'; mutationName: string }
  | { type: 'saveCompleted'; at?: DateTime };

export const CampaignBuilderFeedbackContext = React.createContext<Dispatch<FeedbackAction> | null>(null);

const feedbackReducer = (state: FeedbackState, action: FeedbackAction) => {
  switch (action.type) {
    case 'registerInFlightMutation':
      return { ...state, mutationsInFlight: [action.mutationName, ...state.mutationsInFlight] };
    case 'deregisterInFlightMutation':
      return {
        ...state,
        mutationsInFlight: state.mutationsInFlight.filter(mutationName => mutationName !== action.mutationName),
      };
    case 'registerFailedMutation':
      return { ...state, mutationsFailed: [action.mutationName, ...state.mutationsFailed] };
    case 'deregisterFailedMutation':
      return {
        ...state,
        mutationsFailed: state.mutationsFailed.filter(mutationName => mutationName !== action.mutationName),
      };
    case 'saveCompleted': {
      return { ...state, lastSaveFinished: action.at };
    }
    default:
      const a: never = action;
      return a;
  }
};

export const useCampaignBuilderFeedbackReducer = () => {
  return useReducer(feedbackReducer, {
    mutationsInFlight: [],
    mutationsFailed: [],
    lastSaveFinished: undefined,
  });
};

const useStyles = makeStyles({
  loadingButtonContainer: {
    width: '33px',
    height: '33px',
  },
});

type FeedbackProps = {
  mutationsInFlight: string[];
  mutationsFailed: string[];
  lastSavedTimestamp?: DateTime;
};

export const CampaignBuilderFeedback: FC<FeedbackProps> = ({
  mutationsInFlight,
  mutationsFailed,
  lastSavedTimestamp,
}) => {
  const [timeSinceLastSaveText, setTimeSinceLastSaveText] = useState<string | null>();

  const showFailedFeedback = !isEmpty(mutationsFailed);
  const showLoadingFeedback = !isEmpty(mutationsInFlight);

  useEffect(() => {
    if (lastSavedTimestamp) {
      setTimeSinceLastSaveText('just now');

      const intervalId = setInterval(() => setTimeSinceLastSaveText(lastSavedTimestamp.toRelative()), 30000);
      return () => clearInterval(intervalId);
    }

    return undefined;
  }, [lastSavedTimestamp]);

  const uniqueMutationsInFlight = removeArrayDuplicates(mutationsInFlight);
  const uniqueMutationsFailed = removeArrayDuplicates(mutationsFailed);

  const { loadingButtonContainer } = useStyles();
  return (
    <Grid container={true} spacing={1} alignItems="center">
      <Grid item={true} className={loadingButtonContainer}>
        {showLoadingFeedback ? (
          <Loading variant="button" />
        ) : showFailedFeedback ? (
          <ThumbDownIcon color="secondary" />
        ) : (
          <ThumbUpIcon color="primary" />
        )}
      </Grid>
      <Grid item={true} zeroMinWidth={true}>
        <Typography variant="subtitle2">
          {showLoadingFeedback
            ? `Saving ${uniqueMutationsInFlight.join(', ')} ..`
            : showFailedFeedback
            ? `The field(s) ${uniqueMutationsFailed.join(', ')} failed to save.`
            : `The draft was saved ${
                timeSinceLastSaveText ? `${timeSinceLastSaveText} and is ready to be published` : ''
              }`}
        </Typography>
      </Grid>
    </Grid>
  );
};

export function useCampaignFieldFeedback(mutationName: string) {
  const feedbackDispatch = useContext(CampaignBuilderFeedbackContext);

  const registerMutation = useCallback(() => {
    feedbackDispatch
      ? feedbackDispatch({ type: 'registerInFlightMutation', mutationName })
      : logger.warn(
          'Register mutation failed due to missing feedback context. Please ensure that you use the "useFieldState" hook in a component that is wrapped in the CampaignBuilderFeedbackContext',
        );
  }, [feedbackDispatch, mutationName]);

  const deregisterMutation = useCallback(
    (mutationFinishedSuccessfully: boolean) => {
      if (feedbackDispatch) {
        feedbackDispatch({ type: 'deregisterInFlightMutation', mutationName });

        if (mutationFinishedSuccessfully) {
          feedbackDispatch({ type: 'deregisterFailedMutation', mutationName });
          feedbackDispatch({ type: 'saveCompleted', at: DateTime.local() });
        } else {
          feedbackDispatch({ type: 'registerFailedMutation', mutationName });
        }
      } else {
        logger.warn(
          'Deregister mutation failed due to missing feedback context. Please ensure that you use the "useFieldState" hook in a component that is wrapped in the CampaignBuilderFeedbackContext',
        );
      }
    },
    [feedbackDispatch, mutationName],
  );

  return { registerMutation, deregisterMutation };
}
