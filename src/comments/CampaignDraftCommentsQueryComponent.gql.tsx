import { gql } from '@apollo/client';
import React, { Component, ComponentType } from 'react';

import BHQuery from '../../common/error-components/BHQuery';
import { CampaignDraftComments, CampaignDraftCommentsVariables } from './__generated__/CampaignDraftComments';

export const QUERY_CAMPAIGN_DRAFT_COMMENTS = gql`
  query CampaignDraftComments($campaignMetaID: ID!) {
    campaignDraftComments(campaignDraftMetaId: $campaignMetaID, orderBy: createdAt_DESC, first: 12) {
      edges {
        node {
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
    }
  }
`;

interface ICampaignDraftCommentsQueryProps {
  data?: CampaignDraftComments;
  loading: boolean;
}

export type CampaignDraftCommentsQueryProps = ICampaignDraftCommentsQueryProps;

export function CampaignDraftCommentsQueryHOC<TData = {}>(
  WrappedComponent: ComponentType<TData & CampaignDraftCommentsQueryProps>,
) {
  interface IPassThroughProps {
    getCommentsForCampaignDraftMetaId: string;
  }
  type Props = IPassThroughProps & TData;

  return class WithQueryData extends Component<Props> {
    public render() {
      const { getCommentsForCampaignDraftMetaId: getCommentsForCampaignMetaID, ...props } = this.props;

      return (
        <BHQuery<CampaignDraftComments, CampaignDraftCommentsVariables>
          query={QUERY_CAMPAIGN_DRAFT_COMMENTS}
          variables={{ campaignMetaID: getCommentsForCampaignMetaID }}
        >
          {({ data, loading }) => {
            return <WrappedComponent {...(props as TData)} data={data} loading={loading} />;
          }}
        </BHQuery>
      );
    }
  };
}
