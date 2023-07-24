import { MutationFunction } from '@apollo/client';
import { gql } from '@apollo/client';
import React, { Component, ComponentType } from 'react';

import BHMutation from '../../common/error-components/BHMutation';
import { AddCampaignDraftComment, AddCampaignDraftCommentVariables } from './__generated__/AddCampaignDraftComment';
import { QUERY_CAMPAIGN_DRAFT_COMMENTS } from './CampaignDraftCommentsQueryComponent.gql';

const MUTATION_ADD_CAMPAIGN_DRAFT_COMMENT = gql`
  mutation AddCampaignDraftComment($campaignMetaID: ID!, $comment: String!) {
    campaignDraftCommentCreate(text: $comment, campaignDraftMetaId: $campaignMetaID) {
      id
      createdAt {
        canView
        value
      }
      updatedAt {
        canView
        value
      }
      author {
        canView
        value {
          id
          details {
            canView
            value {
              id
            }
          }
        }
      }
      text {
        canView
        value
      }
    }
  }
`;

export interface ICampaignDraftCommentsMutationProps {
  addCampaignDraftComment: (
    commentText: string,
  ) => ReturnType<MutationFunction<AddCampaignDraftComment, AddCampaignDraftCommentVariables>>;
  loadingAddCampaignDraftComment: boolean;
}

export function CampaignDraftCommentsMutationHOC<TData extends {}>(
  WrappedComponent: ComponentType<TData & ICampaignDraftCommentsMutationProps>,
) {
  interface IPassThroughProps {
    postCommentsForCampaignDraftMetaId: string;
  }
  return class WithMutation extends Component<TData & IPassThroughProps> {
    public render() {
      const { postCommentsForCampaignDraftMetaId: postCommentsForCampaignMetaID, ...props } = this.props;
      return (
        <BHMutation<AddCampaignDraftComment, AddCampaignDraftCommentVariables>
          mutation={MUTATION_ADD_CAMPAIGN_DRAFT_COMMENT}
        >
          {(mutation, { loading }) => {
            const mutationWrapper = (commentText: string) => {
              return mutation({
                refetchQueries: [
                  {
                    query: QUERY_CAMPAIGN_DRAFT_COMMENTS,
                    variables: { campaignMetaID: postCommentsForCampaignMetaID },
                  },
                  'CampaignDraftCommentsData',
                ],
                variables: { campaignMetaID: postCommentsForCampaignMetaID, comment: commentText },
              });
            };
            return (
              <WrappedComponent
                {...(props as TData)}
                addCampaignDraftComment={mutationWrapper}
                loadingAddCampaignDraftComment={loading}
              />
            );
          }}
        </BHMutation>
      );
    }
  };
}
