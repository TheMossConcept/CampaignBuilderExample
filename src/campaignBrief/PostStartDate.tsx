import { gql } from '@apollo/client';
import { getProp } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import { DateTime } from 'luxon';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { DateInput } from '../../common/form/DateAndTimeInputs';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftPostStartDateQuery,
  CampaignDraftPostStartDateQueryVariables,
} from './__generated__/CampaignDraftPostStartDateQuery';
import {
  CampaignDraftUpdatePostStartDate,
  CampaignDraftUpdatePostStartDateVariables,
} from './__generated__/CampaignDraftUpdatePostStartDate';

const MUTATE_UPDATE_POST_START_DATE = gql`
  mutation CampaignDraftUpdatePostStartDate($campaignDraftId: ID!, $postStartDate: date) {
    campaignDraftUpdatePostIntervalStart(campaignDraftId: $campaignDraftId, postIntervalStart: $postStartDate) {
      id
      version
      postIntervalStart {
        value
      }
    }
  }
`;

const QUERY_POST_START_DATE = gql`
  query CampaignDraftPostStartDateQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      postIntervalStart {
        value
      }
    }
  }
`;

type Props = { campaignDraftId: string; debounceValue?: number };

export const CDraftPostStartDate: FC<Props> = ({ campaignDraftId, debounceValue }) => {
  const [postStartDate, setPostStartDate] = useState<DateTime | undefined | null>();

  const { data, loading, error } = useBHQuery<
    CampaignDraftPostStartDateQuery,
    CampaignDraftPostStartDateQueryVariables
  >(QUERY_POST_START_DATE, {
    variables: { campaignDraftId },
  });
  const initialPostStartDate = getProp(data)
    .on('campaignDraft')
    .onValue('postIntervalStart')
    .get();
  const convertedInitialPostStartDate = DateTime.isDateTime(initialPostStartDate)
    ? initialPostStartDate
    : typeof initialPostStartDate === 'string'
    ? DateTime.fromISO(initialPostStartDate)
    : undefined;
  const [hasBeenInitialized] = useCampaignFieldInitialization(
    convertedInitialPostStartDate,
    setPostStartDate,
    loading,
    error,
  );

  const {
    valueForMutation: postStartDateForMutation,
    setValueWithStateUpdates: setPostStartDateWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [postStartDate, setPostStartDate],
    yupValidators.campaignDraft.postIntervalStart,
    'post start date',
    debounceValue,
  );

  const [updatePostStartDateMutation] = useBHMutation<
    CampaignDraftUpdatePostStartDate,
    CampaignDraftUpdatePostStartDateVariables
  >(MUTATE_UPDATE_POST_START_DATE, {
    onCompleted: () => deregisterMutation(true),
    onError: () => deregisterMutation(false),
  });

  useEffect(() => {
    if (postStartDateForMutation !== undefined) {
      updatePostStartDateMutation({
        variables: { campaignDraftId, postStartDate: postStartDateForMutation },
      });
    }
  }, [campaignDraftId, postStartDateForMutation, updatePostStartDateMutation]);

  return (
    <DateInput
      state={[postStartDate, setPostStartDateWithStateUpdates]}
      disabled={!hasBeenInitialized}
      error={validationError}
      label="Post start date"
    />
  );
};
