import { gql } from '@apollo/client';
import { getProp } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import { Grid } from '@material-ui/core';
import { DateTime } from 'luxon';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { DateInput, TimeInput } from '../../common/form/DateAndTimeInputs';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftEndDateQuery,
  CampaignDraftEndDateQueryVariables,
} from './__generated__/CampaignDraftEndDateQuery';
import {
  CampaignDraftUpdateEndDate,
  CampaignDraftUpdateEndDateVariables,
} from './__generated__/CampaignDraftUpdateEndDate';

const MUTATE_UPDATE_END_DATE = gql`
  mutation CampaignDraftUpdateEndDate($campaignDraftId: ID!, $endDate: date) {
    campaignDraftUpdateEndDate(campaignDraftId: $campaignDraftId, endDate: $endDate) {
      id
      version
      endDate {
        value
      }
    }
  }
`;

const QUERY_END_DATE = gql`
  query CampaignDraftEndDateQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      endDate {
        value
      }
    }
  }
`;

type Props = { campaignDraftId: string; debounceValue?: number };

export const CDraftEndDate: FC<Props> = ({ campaignDraftId, debounceValue }) => {
  const [endDate, setEndDate] = useState<DateTime | undefined | null>();

  const { data, loading, error } = useBHQuery<CampaignDraftEndDateQuery, CampaignDraftEndDateQueryVariables>(
    QUERY_END_DATE,
    {
      variables: { campaignDraftId },
    },
  );
  const initialEndDate = getProp(data)
    .on('campaignDraft')
    .onValue('endDate')
    .get();
  const convertedInitialEndDate = DateTime.isDateTime(initialEndDate)
    ? initialEndDate
    : typeof initialEndDate === 'string'
    ? DateTime.fromISO(initialEndDate)
    : undefined;

  const [hasBeenInitialized] = useCampaignFieldInitialization(convertedInitialEndDate, setEndDate, loading, error);

  const {
    valueForMutation: endDateForMutation,
    setValueWithStateUpdates: setEndDateWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [endDate, setEndDate],
    yupValidators.campaignDraft.endDate,
    'campaign end date',
    debounceValue,
  );

  const [updateStartDateMutation] = useBHMutation<CampaignDraftUpdateEndDate, CampaignDraftUpdateEndDateVariables>(
    MUTATE_UPDATE_END_DATE,
    {
      onCompleted: () => deregisterMutation(true),
      onError: () => deregisterMutation(false),
    },
  );

  useEffect(() => {
    if (endDateForMutation !== undefined) {
      updateStartDateMutation({
        variables: { campaignDraftId, endDate: endDateForMutation },
      });
    }
  }, [campaignDraftId, endDateForMutation, updateStartDateMutation]);

  return (
    <Grid container={true} spacing={1}>
      <Grid item={true} xs={6}>
        <DateInput
          state={[endDate, setEndDateWithStateUpdates]}
          disabled={!hasBeenInitialized}
          error={validationError}
          label="End date"
        />
      </Grid>
      <Grid item={true} xs={6}>
        <TimeInput
          state={[endDate, setEndDateWithStateUpdates]}
          disabled={!hasBeenInitialized}
          error={validationError}
          label="End time"
        />
      </Grid>
    </Grid>
  );
};
