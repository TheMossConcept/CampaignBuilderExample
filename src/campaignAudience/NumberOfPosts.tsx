import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { Tooltip, Typography } from '@material-ui/core';
import React, { FC, useEffect } from 'react';

import { CurrencyEnum } from '../../../__generated__/types';
import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { AddCurrencyToBudget, ExtractNumbersFromBudget } from '../../../utils/BudgetHelpers';
import { logger } from '../../../utils/Logger';
import { NumberInput } from '../../common/form/SimpleFormFields';
import { CampaignBudgetQuery, CampaignBudgetQueryVariables } from './__generated__/CampaignBudgetQuery';
import {
  UpdateCampaignBudgetMutation,
  UpdateCampaignBudgetMutationVariables,
} from './__generated__/UpdateCampaignBudgetMutation';

// Number of posts is inferred from the campaign budget (1 post = 1000 DKK)
const MUTATE_UPDATE_CAMPAIGN_BUDGET = gql`
  mutation UpdateCampaignBudgetMutation($campaignId: ID!, $budget: String!) {
    campaignUpdateBudget(campaignId: $campaignId, budget: $budget) {
      id
      version
      budget {
        value
      }
    }
  }
`;

const QUERY_CAMPAIGN_BUDGET = gql`
  query CampaignBudgetQuery($campaignId: ID!) {
    campaign(id: $campaignId) {
      id
      version
      budget {
        value
      }
      draftMeta {
        value {
          id
          draft {
            value {
              id
              targetNumberOfInfluencers {
                value
              }
              numberOfPostsPerInfluencer {
                value
              }
            }
          }
        }
      }
    }
  }
`;

type Props = { campaignId: string };

// Assume all budgets are set in DKK as is now the convention (1000 DKK = 1 post)
export const POST_PRICE = 1000;

const CampaignNumberOfPosts: FC<Props> = ({ campaignId }) => {
  const { data } = useBHQuery<CampaignBudgetQuery, CampaignBudgetQueryVariables>(QUERY_CAMPAIGN_BUDGET, {
    variables: { campaignId },
  });

  const initialBudget = getProp(data)
    .on('campaign')
    .onValue('budget')
    .get();
  const budgetNumber = initialBudget ? ExtractNumbersFromBudget(initialBudget) : undefined;
  const initialNumberOfPosts = budgetNumber && budgetNumber > 0 ? budgetNumber / POST_PRICE : 0;

  const targetNumberOfInfluencers =
    getProp(data)
      .on('campaign')
      .onValue('draftMeta')
      .onValue('draft')
      .onValue('targetNumberOfInfluencers')
      .get() || 0;
  const numberOfPostsPrInfluencer =
    getProp(data)
      .on('campaign')
      .onValue('draftMeta')
      .onValue('draft')
      .onValue('numberOfPostsPerInfluencer')
      .get() || 0;

  const numberOfPosts = targetNumberOfInfluencers * numberOfPostsPrInfluencer;

  const [updateNumberOfPostsMutation] = useBHMutation<
    UpdateCampaignBudgetMutation,
    UpdateCampaignBudgetMutationVariables
  >(MUTATE_UPDATE_CAMPAIGN_BUDGET);

  useEffect(() => {
    if (isDefined(numberOfPosts) && numberOfPosts !== initialNumberOfPosts) {
      updateNumberOfPostsMutation({
        variables: { budget: AddCurrencyToBudget(numberOfPosts * POST_PRICE, CurrencyEnum.DKK), campaignId },
      });
    }
  }, [campaignId, updateNumberOfPostsMutation, numberOfPosts, initialNumberOfPosts]);

  return (
    <Tooltip
      title={
        <Typography color="inherit">
          This field is automatically set based on the values of influencer target and posts per influencer
        </Typography>
      }
    >
      <div>
        <NumberInput
          state={[numberOfPosts, () => logger.log('Number of posts is a read-only field but a write was attempted')]}
          disabled={true}
          fullWidth={true}
          label="Total number of posts"
        />
      </div>
    </Tooltip>
  );
};

export default CampaignNumberOfPosts;
