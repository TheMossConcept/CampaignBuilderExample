import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import { Card, makeStyles } from '@material-ui/core';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { TextInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import { CampaignNameQuery, CampaignNameQueryVariables } from './__generated__/CampaignNameQuery';
import { CampaignNameUpdate, CampaignNameUpdateVariables } from './__generated__/CampaignNameUpdate';

type Props = {
  campaignId: string;
  debounceValue?: number;
};

const useStyles = makeStyles({
  card: {
    padding: '12px',
  },
});

const MUTATION_CAMPAIGN_NAME_UPDATE = gql`
  mutation CampaignNameUpdate($campaignId: ID!, $campaignName: String!) {
    campaignUpdateName(campaignId: $campaignId, name: $campaignName) {
      id
      version
      name {
        value
      }
    }
  }
`;

const QUERY_CAMPAIGN_NAME = gql`
  query CampaignNameQuery($campaignId: ID!) {
    campaign(id: $campaignId) {
      id
      version
      name {
        value
      }
    }
  }
`;

export const UpdateCampaignName: FC<Props> = ({ campaignId, debounceValue }) => {
  const [campaignName, setCampaignName] = useState<string | undefined>();

  const { data, loading, error } = useBHQuery<CampaignNameQuery, CampaignNameQueryVariables>(QUERY_CAMPAIGN_NAME, {
    variables: { campaignId },
  });
  const initialName = getProp(data)
    .on('campaign')
    .onValue('name')
    .get();

  const [hasBeenInitialized] = useCampaignFieldInitialization(initialName, setCampaignName, loading, error);

  const {
    valueForMutation: campaignNameForMutation,
    setValueWithStateUpdates: setCampaignNameWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [campaignName, setCampaignName],
    yupValidators.campaign.name,
    'campaign name',
    debounceValue,
  );

  const [updateNameMutation] = useBHMutation<CampaignNameUpdate, CampaignNameUpdateVariables>(
    MUTATION_CAMPAIGN_NAME_UPDATE,
    {
      onCompleted: () => {
        deregisterMutation(true);
      },
      onError: () => deregisterMutation(false),
    },
  );

  useEffect(() => {
    if (isDefined(campaignNameForMutation)) {
      updateNameMutation({ variables: { campaignId, campaignName: campaignNameForMutation } });
    }
  }, [campaignId, campaignNameForMutation, updateNameMutation]);

  const { card } = useStyles();
  return (
    <Card className={card}>
      <TextInput
        state={[campaignName, setCampaignNameWithStateUpdates]}
        error={validationError}
        disabled={!hasBeenInitialized}
        multiline={false}
        fullWidth={true}
        label="Campaign name"
      />
    </Card>
  );
};
