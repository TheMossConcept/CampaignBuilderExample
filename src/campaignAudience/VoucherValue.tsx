import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import { InputAdornment } from '@material-ui/core';
import React, { FC, useCallback, useEffect, useState } from 'react';

import { PostMediaType } from '../../../__generated__/types';
import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { AddCurrencyToBudget, ExtractNumbersFromBudget } from '../../../utils/BudgetHelpers';
import { NumberInput } from '../../common/form/SimpleFormFields';
import { CompanyCurrencyHOC, CompanyCurrencyQueryProps } from '../../common/validation/CompanyCurrencyQuery.gql';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftVoucherValueQuery,
  CampaignDraftVoucherValueQueryVariables,
} from './__generated__/CampaignDraftVoucherValueQuery';
import {
  UpdateCampaignDraftSubmissionRewardVoucherValue,
  UpdateCampaignDraftSubmissionRewardVoucherValueVariables,
} from './__generated__/UpdateCampaignDraftSubmissionRewardVoucherValue';

const MUTATE_UPDATE_VOUCHER_VALUE = gql`
  mutation UpdateCampaignDraftSubmissionRewardVoucherValue(
    $campaignDraftId: ID!
    $postMediaType: PostMediaType!
    $voucherValue: Currency!
  ) {
    campaignDraftUpdateSubmissionRewardVoucherValue(
      campaignDraftId: $campaignDraftId
      voucherValue: $voucherValue
      postMediaType: $postMediaType
    ) {
      id
      version
      rewards {
        value {
          id
          version
          voucherValue {
            value
          }
          postMediaType {
            value
          }
        }
      }
    }
  }
`;

const QUERY_VOUCHER_VALUE = gql`
  query CampaignDraftVoucherValueQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      rewards {
        value {
          id
          version
          voucherValue {
            value
          }
          postMediaType {
            value
          }
        }
      }
    }
  }
`;

type Props = { campaignDraftId: string; postMediaType: PostMediaType; debounceValue?: number };

const CDraftVoucherValue: FC<Props & CompanyCurrencyQueryProps> = ({
  campaignDraftId,
  postMediaType,
  debounceValue,
  currency,
}) => {
  const [voucherValue, setVoucherValue] = useState<string | undefined>();
  const { data, loading, error } = useBHQuery<CampaignDraftVoucherValueQuery, CampaignDraftVoucherValueQueryVariables>(
    QUERY_VOUCHER_VALUE,
    {
      variables: { campaignDraftId },
    },
  );
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

  const initialVoucherValue = getProp(rewardForPostMediaType)
    .onValue('voucherValue')
    .get();
  const [hasBeenInitialized] = useCampaignFieldInitialization(initialVoucherValue, setVoucherValue, loading, error);

  const {
    valueForMutation: voucherValueForMutation,
    setValueWithStateUpdates: setVoucherValueWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [voucherValue, setVoucherValue],
    yupValidators.campaignDraft.voucherValue,
    'voucher value',
    debounceValue,
  );

  const [updateVoucherValue] = useBHMutation<
    UpdateCampaignDraftSubmissionRewardVoucherValue,
    UpdateCampaignDraftSubmissionRewardVoucherValueVariables
  >(MUTATE_UPDATE_VOUCHER_VALUE, {
    onCompleted: () => deregisterMutation(true),
    onError: () => deregisterMutation(false),
  });

  useEffect(() => {
    if (isDefined(voucherValueForMutation) && hasBeenInitialized) {
      updateVoucherValue({
        variables: { voucherValue: voucherValueForMutation, postMediaType, campaignDraftId },
      });
    }
  }, [campaignDraftId, voucherValueForMutation, updateVoucherValue, postMediaType, hasBeenInitialized]);

  const currencyNumber = ExtractNumbersFromBudget(voucherValue || '');
  const handleVoucherValueStateChange = useCallback(
    (currencyValue: number) => {
      const newVoucherValue = AddCurrencyToBudget(currencyValue, currency);
      setVoucherValueWithStateUpdates(newVoucherValue);
    },
    [currency, setVoucherValueWithStateUpdates],
  );

  return (
    <NumberInput
      state={[currencyNumber, handleVoucherValueStateChange]}
      InputProps={{ startAdornment: <InputAdornment position="start">{currency}</InputAdornment> }}
      error={validationError}
      disabled={!hasBeenInitialized}
      fullWidth={true}
      label="Voucher value"
    />
  );
};

export default CompanyCurrencyHOC(CDraftVoucherValue);
