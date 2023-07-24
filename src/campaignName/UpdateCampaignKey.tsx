import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import { Card, makeStyles } from '@material-ui/core';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { TextInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import { CampaignAPIParamQuery, CampaignAPIParamQueryVariables } from './__generated__/CampaignAPIParamQuery';
import { CampaignSetKey, CampaignSetKeyVariables } from './__generated__/CampaignSetKey';

type Props = {
  campaignId: string;
  debounceValue?: number;
};

const useStyles = makeStyles({
  card: {
    padding: '12px',
  },
});

const MUTATION_CAMPAIGN_KEY = gql`
  mutation CampaignSetKey($campaignId: ID!, $campaignKey: String!) {
    campaignSetKey(campaignId: $campaignId, campaignKey: $campaignKey) {
      id
      apiParamName {
        value
      }
    }
  }
`;

const QUERY_CAMPAIGN_API_PARAM = gql`
  query CampaignAPIParamQuery($campaignId: ID!) {
    campaign(id: $campaignId) {
      id
      apiParamName {
        value
      }
    }
  }
`;

export const UpdateCampaignKey: FC<Props> = ({ campaignId, debounceValue }) => {
  const [campaignName, setCampaignName] = useState<string | undefined>();

  const { data, loading, error } = useBHQuery<CampaignAPIParamQuery, CampaignAPIParamQueryVariables>(
    QUERY_CAMPAIGN_API_PARAM,
    {
      variables: { campaignId },
    },
  );
  const initialName = getProp(data)
    .on('campaign')
    .onValue('apiParamName')
    .get();

  const [hasBeenInitialized] = useCampaignFieldInitialization(initialName, setCampaignName, loading, error);

  const {
    valueForMutation: campaignKeyForMutation,
    setValueWithStateUpdates: setCampaignNameWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [campaignName, setCampaignName],
    yupValidators.campaign.name,
    'API ID',
    debounceValue,
    undefined,
    true,
  );

  const [updateNameMutation] = useBHMutation<CampaignSetKey, CampaignSetKeyVariables>(MUTATION_CAMPAIGN_KEY, {
    onCompleted: () => {
      deregisterMutation(true);
    },
    onError: () => deregisterMutation(false),
  });

  useEffect(() => {
    if (isDefined(campaignKeyForMutation)) {
      updateNameMutation({ variables: { campaignId, campaignKey: campaignKeyForMutation } });
    }
  }, [campaignId, campaignKeyForMutation, updateNameMutation]);

  const { card } = useStyles();
  return (
    <Card className={card}>
      <TextInput
        state={[campaignName, setCampaignNameWithStateUpdates]}
        error={validationError}
        disabled={!hasBeenInitialized}
        multiline={false}
        fullWidth={true}
        label="API ID"
      />
    </Card>
  );
};
