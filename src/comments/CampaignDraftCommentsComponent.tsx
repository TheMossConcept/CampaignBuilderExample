import { getProp } from '@brandheroes/brandheroes-shared-project';
import { campaignDraftCommentCreateInputArgsValidator, containsValidationErrors } from '@brandheroes/shared-validation';
import { Grid } from '@material-ui/core';
import React, { PureComponent } from 'react';

import AddCommentComponent from '../../common/comments/AddCommentComponent';
import CommentDivider from '../../common/comments/CommentDivider';
import CommentStatelessComponent from '../../common/comments/CommentStatelessComponent';
import Loading from '../../common/Loading';
import {
  CampaignDraftCommentsMutationHOC,
  ICampaignDraftCommentsMutationProps,
} from './CampaignDraftCommentsMutation.gql';
import {
  CampaignDraftCommentsQueryHOC,
  CampaignDraftCommentsQueryProps,
} from './CampaignDraftCommentsQueryComponent.gql';

const defaultState = {};

type State = Readonly<typeof defaultState>;

interface ICampaignDraftCommentsComponentProps {
  campaignDraftMetaId: string;
}

type Props = ICampaignDraftCommentsComponentProps &
  CampaignDraftCommentsQueryProps &
  ICampaignDraftCommentsMutationProps;

class CampaignDraftCommentsComponent extends PureComponent<Props, State> {
  public readonly state: State = defaultState;

  public render() {
    const { addCampaignDraftComment, loadingAddCampaignDraftComment, loading, data } = this.props;
    if (loading) {
      return <Loading variant="linear" />;
    }

    if (!data) {
      return <></>;
    }

    const campaignDraftComments = getProp(data)
      .on('campaignDraftComments')
      .on('edges')
      .get();

    return (
      <Grid container={true} spacing={2}>
        <Grid item={true} xs={12}>
          <AddCommentComponent
            addComment={addCampaignDraftComment}
            loading={loadingAddCampaignDraftComment}
            placeholder="Add a comment on this campaign draft..."
            validateComment={this.validateUserComment}
          />
        </Grid>
        {campaignDraftComments &&
          campaignDraftComments.map(edge => {
            const authorDetailsCanView = getProp(edge)
              .on('node')
              .onValue('author')
              .on('details')
              .on('canView')
              .get();
            const createdAtCanView = getProp(edge)
              .on('node')
              .on('createdAt')
              .on('canView')
              .get();
            const textCanView = getProp(edge)
              .on('node')
              .on('text')
              .on('canView')
              .get();
            const updatedAtCanView = getProp(edge)
              .on('node')
              .on('updatedAt')
              .on('canView')
              .get();

            if (!authorDetailsCanView || !createdAtCanView || !textCanView || !updatedAtCanView) {
              // User rights insufficient
              return <></>;
            }

            const comment = getProp(edge)
              .on('node')
              .onValue('text')
              .get();
            const dateCreated = getProp(edge)
              .on('node')
              .onValue('createdAt')
              .get();
            const dateUpdated = getProp(edge)
              .on('node')
              .onValue('updatedAt')
              .get();
            const userDetailID = getProp(edge)
              .on('node')
              .onValue('author')
              .onValue('details')
              .on('id')
              .get();

            return (
              <Grid item={true} xs={12} key={edge.node.id}>
                <Grid container={true} spacing={2}>
                  <Grid item={true} xs={12}>
                    <CommentDivider />
                  </Grid>
                  <Grid item={true} xs={12}>
                    <CommentStatelessComponent
                      comment={comment || ''}
                      dateCreated={dateCreated}
                      dateUpdated={dateUpdated}
                      userDetailID={userDetailID || ''}
                    />
                  </Grid>
                </Grid>
              </Grid>
            );
          })}
      </Grid>
    );
  }

  private validateUserComment = (comment: string): boolean => {
    const errors = campaignDraftCommentCreateInputArgsValidator({
      campaignDraftMetaId: this.props.campaignDraftMetaId,
      text: comment,
    });
    return !containsValidationErrors(errors);
  };
}

export default CampaignDraftCommentsMutationHOC(CampaignDraftCommentsQueryHOC(CampaignDraftCommentsComponent));
