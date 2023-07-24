import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import React, { FC, useCallback, useEffect, useState } from 'react';

import { CampaignType } from '../../../__generated__/types';
import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { SwitchInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftCampaignTypeQuery,
  CampaignDraftCampaignTypeQueryVariables,
} from './__generated__/CampaignDraftCampaignTypeQuery';
import {
  UpdateCampaignDraftCampaignType,
  UpdateCampaignDraftCampaignTypeVariables,
} from './__generated__/UpdateCampaignDraftCampaignType';

const MUTATE_UPDATE_CAMPAIGN_DRAFT_CAMPAIGN_TYPE = gql`
  mutation UpdateCampaignDraftCampaignType($campaignDraftId: ID!, $campaignType: CampaignType!) {
    campaignDraftUpdateCampaignType(campaignDraftId: $campaignDraftId, campaignType: $campaignType) {
      id
      version
      campaignType {
        value
      }
    }
  }
`;

const QUERY_CAMPAIGN_DRAFT_AUDIENCE_TYPE = gql`
  query CampaignDraftCampaignTypeQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      campaignType {
        value
      }
    }
  }
`;

type Props = { campaignDraftId: string; debounceValue?: number };

export const CDraftCampaignType: FC<Props> = ({ campaignDraftId, debounceValue = 0 }) => {
  const [campaignType, setCampaignType] = useState<CampaignType | undefined>();

  const { data, loading, error } = useBHQuery<CampaignDraftCampaignTypeQuery, CampaignDraftCampaignTypeQueryVariables>(
    QUERY_CAMPAIGN_DRAFT_AUDIENCE_TYPE,
    {
      variables: { campaignDraftId },
    },
  );
  const initialCampaignType = getProp(data)
    .on('campaignDraft')
    .onValue('campaignType')
    .get();

  const [hasBeenInitialized] = useCampaignFieldInitialization(initialCampaignType, setCampaignType, loading, error);

  const {
    valueForMutation: campaignTypeForMutation,
    setValueWithStateUpdates: setCampaignTypeWithStatusUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [campaignType, setCampaignType],
    yupValidators.campaignDraft.campaignType,
    'affiliate campaign',
    debounceValue,
  );

  const [updateCampaignType] = useBHMutation<UpdateCampaignDraftCampaignType, UpdateCampaignDraftCampaignTypeVariables>(
    MUTATE_UPDATE_CAMPAIGN_DRAFT_CAMPAIGN_TYPE,
    {
      onCompleted: () => deregisterMutation(true),
      onError: () => deregisterMutation(false),
    },
  );

  useEffect(() => {
    if (isDefined(campaignTypeForMutation)) {
      updateCampaignType({
        variables: {
          campaignType: campaignTypeForMutation,
          campaignDraftId,
        },
      });
    }
  }, [campaignDraftId, campaignTypeForMutation, updateCampaignType]);

  const isAffiliate = campaignType === CampaignType.AFFILIATE;
  const setCampaignTypeThroughToggle = useCallback(
    (newValue: boolean) => {
      if (newValue) {
        setCampaignTypeWithStatusUpdates(CampaignType.AFFILIATE);
      } else {
        setCampaignTypeWithStatusUpdates(CampaignType.COMMISSION);
      }
    },
    [setCampaignTypeWithStatusUpdates],
  );

  return (
    <SwitchInput
      state={[isAffiliate, setCampaignTypeThroughToggle]}
      color="primary"
      error={validationError}
      disabled={!hasBeenInitialized}
      label="Affiliate campaign"
    />
  );
};
