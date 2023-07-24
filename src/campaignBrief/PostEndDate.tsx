import { gql } from '@apollo/client';
import { getProp } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import { DateTime } from 'luxon';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { DateInput } from '../../common/form/DateAndTimeInputs';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftPostEndDateQuery,
  CampaignDraftPostEndDateQueryVariables,
} from './__generated__/CampaignDraftPostEndDateQuery';
import {
  CampaignDraftUpdatePostEndDate,
  CampaignDraftUpdatePostEndDateVariables,
} from './__generated__/CampaignDraftUpdatePostEndDate';

const MUTATE_UPDATE_POST_END_DATE = gql`
  mutation CampaignDraftUpdatePostEndDate($campaignDraftId: ID!, $postEndDate: date) {
    campaignDraftUpdatePostIntervalEnd(campaignDraftId: $campaignDraftId, postIntervalEnd: $postEndDate) {
      id
      version
      postIntervalEnd {
        value
      }
    }
  }
`;

const QUERY_POST_END_DATE = gql`
  query CampaignDraftPostEndDateQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      postIntervalEnd {
        value
      }
    }
  }
`;

type Props = { campaignDraftId: string; debounceValue?: number };

export const CDraftPostEndDate: FC<Props> = ({ campaignDraftId, debounceValue }) => {
  const [postEndDate, setPostEndDate] = useState<DateTime | undefined | null>();

  const { data, loading, error } = useBHQuery<CampaignDraftPostEndDateQuery, CampaignDraftPostEndDateQueryVariables>(
    QUERY_POST_END_DATE,
    {
      variables: { campaignDraftId },
    },
  );
  const initialPostEndDate = getProp(data)
    .on('campaignDraft')
    .onValue('postIntervalEnd')
    .get();
  const convertedInitialPostEndDate = DateTime.isDateTime(initialPostEndDate)
    ? initialPostEndDate
    : typeof initialPostEndDate === 'string'
    ? DateTime.fromISO(initialPostEndDate)
    : undefined;
  const [hasBeenInitialized] = useCampaignFieldInitialization(
    convertedInitialPostEndDate,
    setPostEndDate,
    loading,
    error,
  );

  const {
    valueForMutation: postEndDateForMutation,
    setValueWithStateUpdates: setPostEndDateWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [postEndDate, setPostEndDate],
    yupValidators.campaignDraft.postIntervalEnd,
    'post end date',
    debounceValue,
  );

  const [updatePostEndDateMutation] = useBHMutation<
    CampaignDraftUpdatePostEndDate,
    CampaignDraftUpdatePostEndDateVariables
  >(MUTATE_UPDATE_POST_END_DATE, {
    onCompleted: () => deregisterMutation(true),
    onError: () => deregisterMutation(false),
  });

  useEffect(() => {
    if (postEndDateForMutation !== undefined) {
      updatePostEndDateMutation({
        variables: { campaignDraftId, postEndDate: postEndDateForMutation },
      });
    }
  }, [campaignDraftId, postEndDateForMutation, updatePostEndDateMutation]);

  return (
    <DateInput
      state={[postEndDate, setPostEndDateWithStateUpdates]}
      disabled={!hasBeenInitialized}
      error={validationError}
      label="Post end date"
    />
  );
};
