import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { SwitchInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftIsGlobalQuery,
  CampaignDraftIsGlobalQueryVariables,
} from './__generated__/CampaignDraftIsGlobalQuery';
import {
  UpdateCampaignDraftIsGlobal,
  UpdateCampaignDraftIsGlobalVariables,
} from './__generated__/UpdateCampaignDraftIsGlobal';

const MUTATE_UPDATE_CAMPAIGN_DRAFT_IS_GLOBAL = gql`
  mutation UpdateCampaignDraftIsGlobal($campaignDraftId: ID!, $isGlobal: Boolean!) {
    campaignDraftUpdateIsGlobal(campaignDraftId: $campaignDraftId, isGlobal: $isGlobal) {
      id
      version
      isGlobal {
        value
      }
    }
  }
`;

const QUERY_CAMPAIGN_DRAFT_IS_GLOBAL = gql`
  query CampaignDraftIsGlobalQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      isGlobal {
        value
      }
    }
  }
`;

type Props = { campaignDraftId: string; debounceValue?: number };

const CDraftGlobalCampaign: FC<Props> = ({ campaignDraftId, debounceValue = 0 }) => {
  const [isGlobal, setIsGlobal] = useState<boolean | undefined>();

  const { data, loading, error } = useBHQuery<CampaignDraftIsGlobalQuery, CampaignDraftIsGlobalQueryVariables>(
    QUERY_CAMPAIGN_DRAFT_IS_GLOBAL,
    {
      variables: { campaignDraftId },
    },
  );
  const initialIsGlobal =
    getProp(data)
      .on('campaignDraft')
      .onValue('isGlobal')
      .get() || undefined;
  const [hasBeenInitialized] = useCampaignFieldInitialization(initialIsGlobal, setIsGlobal, loading, error);

  const {
    valueForMutation: isGlobalCampaignForMutation,
    setValueWithStateUpdates: setIsGlobalCampaignWithStatusUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [isGlobal, setIsGlobal],
    yupValidators.campaignDraft.isGlobal,
    'global campaign',
    debounceValue,
  );

  const [updateIsGlobal] = useBHMutation<UpdateCampaignDraftIsGlobal, UpdateCampaignDraftIsGlobalVariables>(
    MUTATE_UPDATE_CAMPAIGN_DRAFT_IS_GLOBAL,
    {
      onCompleted: () => deregisterMutation(true),
      onError: () => deregisterMutation(false),
    },
  );

  useEffect(() => {
    if (isDefined(isGlobalCampaignForMutation)) {
      updateIsGlobal({
        variables: { isGlobal: isGlobalCampaignForMutation, campaignDraftId },
      });
    }
  }, [campaignDraftId, isGlobalCampaignForMutation, updateIsGlobal]);

  return (
    <SwitchInput
      state={[isGlobal || false, setIsGlobalCampaignWithStatusUpdates]}
      color="primary"
      disabled={!hasBeenInitialized}
      error={validationError}
      label="Global campaign"
    />
  );
};

export default CDraftGlobalCampaign;
