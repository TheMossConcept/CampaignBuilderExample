import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import { validBrandCoinAmounts } from '@brandheroes/shared-validation/dist/validation/yupValidators/sharedValidators';
import { FormLabel } from '@material-ui/core';
import React, { FC, useEffect, useState } from 'react';

import { PostMediaType } from '../../../__generated__/types';
import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { SelectInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftBrandcoinsValueQuery,
  CampaignDraftBrandcoinsValueQueryVariables,
} from './__generated__/CampaignDraftBrandcoinsValueQuery';
import {
  UpdateCampaignDraftSubmissionRewardBrandcoinsValue,
  UpdateCampaignDraftSubmissionRewardBrandcoinsValueVariables,
} from './__generated__/UpdateCampaignDraftSubmissionRewardBrandcoinsValue';

const MUTATE_UPDATE_BRANDCOINS_VALUE = gql`
  mutation UpdateCampaignDraftSubmissionRewardBrandcoinsValue(
    $campaignDraftId: ID!
    $postMediaType: PostMediaType!
    $brandcoins: Int!
  ) {
    campaignDraftUpdateSubmissionRewardBrandcoins(
      campaignDraftId: $campaignDraftId
      brandcoins: $brandcoins
      postMediaType: $postMediaType
    ) {
      id
      version
      rewards {
        value {
          id
          version
          brandcoins {
            value
          }
        }
      }
    }
  }
`;

const QUERY_BRANDCOINS_VALUE = gql`
  query CampaignDraftBrandcoinsValueQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      rewards {
        value {
          id
          version
          postMediaType {
            value
          }
          brandcoins {
            value
          }
        }
      }
    }
  }
`;

type Props = { campaignDraftId: string; postMediaType: PostMediaType; excludeField?: boolean; debounceValue?: number };
const CDraftBrandcoinsValue: FC<Props> = ({
  campaignDraftId,
  postMediaType,
  excludeField = false,
  debounceValue = 0,
}) => {
  // For the dropdown, an empty string means no option selected
  const [brandcoinsValue, setBrandcoinsValue] = useState<number | undefined>();

  const { data, loading, error } = useBHQuery<
    CampaignDraftBrandcoinsValueQuery,
    CampaignDraftBrandcoinsValueQueryVariables
  >(QUERY_BRANDCOINS_VALUE, {
    variables: { campaignDraftId },
    skip: excludeField,
  });
  const rewards = getProp(data)
    .on('campaignDraft')
    .onValue('rewards')
    .get();

  const rewardForPostMediaType = rewards
    ? rewards.find(
        reward =>
          getProp(reward)
            .onValue('postMediaType')
            .get() === postMediaType,
      )
    : undefined;

  const initialBrandcoinsValue = getProp(rewardForPostMediaType)
    .onValue('brandcoins')
    .get();
  const [hasBeenInitialized, setHasBeenInitialized] = useCampaignFieldInitialization(
    initialBrandcoinsValue,
    setBrandcoinsValue,
    loading,
    error,
  );

  const {
    valueForMutation: brandcoinsValueForMutation,
    setValueWithStateUpdates: setBrandcoinsValueWithStateUpdate,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [brandcoinsValue, setBrandcoinsValue],
    yupValidators.campaignDraft.brandcoinsValue,
    'brandcoins value',
    debounceValue,
  );

  useEffect(() => {
    setHasBeenInitialized(false);
  }, [postMediaType, setHasBeenInitialized]);

  const [updateBrandcoinsValue] = useBHMutation<
    UpdateCampaignDraftSubmissionRewardBrandcoinsValue,
    UpdateCampaignDraftSubmissionRewardBrandcoinsValueVariables
  >(MUTATE_UPDATE_BRANDCOINS_VALUE, {
    onCompleted: () => deregisterMutation(true),
    onError: () => deregisterMutation(false),
  });

  useEffect(() => {
    if (excludeField && brandcoinsValue && brandcoinsValue > 0) {
      setBrandcoinsValueWithStateUpdate(0);
    }
  }, [brandcoinsValue, excludeField, setBrandcoinsValueWithStateUpdate]);

  useEffect(() => {
    if (isDefined(brandcoinsValueForMutation) && hasBeenInitialized) {
      updateBrandcoinsValue({
        variables: { brandcoins: brandcoinsValueForMutation, postMediaType, campaignDraftId },
      });
    }
  }, [brandcoinsValueForMutation, campaignDraftId, hasBeenInitialized, postMediaType, updateBrandcoinsValue]);

  return excludeField ? null : (
    <>
      <FormLabel>Brandcoins</FormLabel>
      <SelectInput
        state={[brandcoinsValue, setBrandcoinsValueWithStateUpdate]}
        possibleValues={validBrandCoinAmounts.map(validBrandcoinAmount => ({
          label: validBrandcoinAmount.toString(),
          value: validBrandcoinAmount,
        }))}
        error={validationError}
        fullWidth={true}
      />
    </>
  );
};

export default CDraftBrandcoinsValue;
