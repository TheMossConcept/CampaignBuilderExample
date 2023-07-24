import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import { Grid } from '@material-ui/core';
import { DateTime } from 'luxon';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { DateInput, TimeInput } from '../../common/form/DateAndTimeInputs';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftStartDateQuery,
  CampaignDraftStartDateQueryVariables,
} from './__generated__/CampaignDraftStartDateQuery';
import {
  CampaignDraftUpdateStartDate,
  CampaignDraftUpdateStartDateVariables,
} from './__generated__/CampaignDraftUpdateStartDate';

const MUTATE_UPDATE_START_DATE = gql`
  mutation CampaignDraftUpdateStartDate($campaignDraftId: ID!, $startDate: date!) {
    campaignDraftUpdateStartDate(campaignDraftId: $campaignDraftId, startDate: $startDate) {
      id
      version
      startDate {
        value
      }
    }
  }
`;

const QUERY_START_DATE = gql`
  query CampaignDraftStartDateQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      startDate {
        value
      }
    }
  }
`;

type Props = { campaignDraftId: string; debounceValue?: number };

export const CDraftStartDate: FC<Props> = ({ campaignDraftId, debounceValue }) => {
  const [startDate, setStartDate] = useState<DateTime | undefined | null>();

  const { data, loading, error } = useBHQuery<CampaignDraftStartDateQuery, CampaignDraftStartDateQueryVariables>(
    QUERY_START_DATE,
    {
      variables: { campaignDraftId },
    },
  );
  const initialStartDate = getProp(data)
    .on('campaignDraft')
    .onValue('startDate')
    .get();
  const convertedInitialStartDate = DateTime.isDateTime(initialStartDate)
    ? initialStartDate
    : typeof initialStartDate === 'string'
    ? DateTime.fromISO(initialStartDate)
    : undefined;
  const [hasBeenInitialized] = useCampaignFieldInitialization(convertedInitialStartDate, setStartDate, loading, error);

  const {
    valueForMutation: startDateForMutation,
    setValueWithStateUpdates: setStartDateWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [startDate, setStartDate],
    yupValidators.campaignDraft.startDate,
    'campaign start date',
    debounceValue,
  );

  const [updateStartDateMutation] = useBHMutation<CampaignDraftUpdateStartDate, CampaignDraftUpdateStartDateVariables>(
    MUTATE_UPDATE_START_DATE,
    {
      onCompleted: () => deregisterMutation(true),
      onError: () => deregisterMutation(false),
    },
  );

  useEffect(() => {
    if (isDefined(startDateForMutation)) {
      updateStartDateMutation({
        variables: { campaignDraftId, startDate: startDateForMutation },
      });
    }
  }, [campaignDraftId, startDateForMutation, updateStartDateMutation]);

  return (
    <Grid container={true} spacing={1}>
      <Grid item={true} xs={6}>
        <DateInput
          state={[startDate, setStartDateWithStateUpdates]}
          disabled={!hasBeenInitialized}
          error={validationError}
          label="Start date"
        />
      </Grid>
      <Grid item={true} xs={6}>
        <TimeInput
          state={[startDate, setStartDateWithStateUpdates]}
          disabled={!hasBeenInitialized}
          error={validationError}
          label="Start time"
        />
      </Grid>
    </Grid>
  );
};
