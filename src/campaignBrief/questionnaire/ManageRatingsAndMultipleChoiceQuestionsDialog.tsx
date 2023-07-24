import { NetworkStatus } from '@apollo/client';
import { gql } from '@apollo/client';
import { getProp } from '@brandheroes/brandheroes-shared-project';
import { Checkbox, FormControlLabel, Grid } from '@material-ui/core';
import React, { FC, useState } from 'react';

import { MultipleChoiceQuestion, RatingQuestion } from '../../../../__generated__/types';
import BaseDialog, { BaseDialogProps } from '../../../common/dialogs/BaseDialog';
import BHMutation from '../../../common/error-components/BHMutation';
import BHQuery from '../../../common/error-components/BHQuery';
import Loading from '../../../common/Loading';
import { CreateProductFeedback, CreateProductFeedbackVariables } from './__generated__/CreateProductFeedback';
import { QueryQuestionnaireData, QueryQuestionnaireDataVariables } from './__generated__/QueryQuestionnaireData';
import {
  SetQuestionnaireQuestions,
  SetQuestionnaireQuestionsVariables,
} from './__generated__/SetQuestionnaireQuestions';
import MultipleChoiceQuestions, { MultipleChoiceQuestionFragment } from './MultipleChoiceQuestion';
import {
  createAddToFn,
  createEditOptionFn,
  createRemoveOptionFn,
  editQuestion,
  questionReducer,
  ratingReducer,
  removeQuestion,
} from './questionnaireFunctions';
import RatingQuestions, { RatingQuestionFragment } from './RatingQuestions';

interface IManageRatingsAndMultipleChoiceQuestionsDialogProps {
  campaignDraftId: string;
  // Make this explicit here to make it clear that we are not just forwarding this to the base dialog component
  closeDialog: () => void;
}

type Props = IManageRatingsAndMultipleChoiceQuestionsDialogProps &
  Omit<BaseDialogProps, 'title' | 'submitText' | 'onSubmit' | 'onClose'>;

type QuestionnaireInformation = { id: string; version: number } | undefined;

const ManageRatingsAndMultipleChoiceQuestionsDialog: FC<Props> = ({ campaignDraftId, closeDialog, ...dialogProps }) => {
  const [multipleChoiceQuestions, setMultipleChoiceQuestions] = useState<MultipleChoiceQuestion[]>([]);
  const [ratingQuestions, setRatingQuestions] = useState<RatingQuestion[]>([]);

  const [initialized, setInitialized] = useState(false);
  const [questionnaireInformation, setQuestionnaireInformation] = useState<QuestionnaireInformation>(undefined);

  const [includeMultipleChoiceQuestions, setIncludeMultipleChoiceQuestions] = useState(false);
  const [includeRatingQuestions, setIncludeRatingQuestions] = useState(false);

  const resetState = () => {
    setMultipleChoiceQuestions([]);
    setRatingQuestions([]);

    setIncludeMultipleChoiceQuestions(false);
    setInitialized(false);

    setQuestionnaireInformation(undefined);
  };

  const initialize = (data: QueryQuestionnaireData | undefined, networkStatus: NetworkStatus) => {
    const questionnaireId = getProp(data)
      .on('campaignDraft')
      .onValue('productFeedback')
      .onValue('questionnaire')
      .on('id')
      .get();
    const questionnaireVersion = getProp(data)
      .on('campaignDraft')
      .onValue('productFeedback')
      .onValue('questionnaire')
      .on('version')
      .get();

    if (networkStatus === 7 && !initialized) {
      const reducedRatings = ratingReducer(
        getProp(data)
          .on('campaignDraft')
          .onValue('productFeedback')
          .onValue('questionnaire')
          .onValue('ratingQuestions')
          .get(),
      );
      const reducedQuestions = questionReducer(
        getProp(data)
          .on('campaignDraft')
          .onValue('productFeedback')
          .onValue('questionnaire')
          .onValue('multipleChoiceQuestions')
          .get(),
      );
      setMultipleChoiceQuestions(reducedQuestions);
      setRatingQuestions(reducedRatings);

      setInitialized(true);

      setIncludeMultipleChoiceQuestions(reducedQuestions.length > 0);
      setIncludeRatingQuestions(reducedRatings.length > 0);

      if (questionnaireId && questionnaireVersion) {
        setQuestionnaireInformation({ id: questionnaireId, version: questionnaireVersion });
      }
    }
  };

  return (
    <BHMutation<SetQuestionnaireQuestions, SetQuestionnaireQuestionsVariables>
      mutation={MUTATE_QUESTIONNAIRE_SET_QUESTIONS}
      refetchQueries={['QueryQuestionnaireData']}
      onCompleted={() => {
        // This is always the last mutation run when submitting - if that changes, reset state somewhere else
        resetState();
      }}
      onError={() => {
        // This is always the last mutation run when submitting - if that changes, reset state somewhere else
        resetState();
      }}
    >
      {setQuestionnaireQuestions => {
        /* This mutation is called initially, when we create the questionnaire where there is nothing in cache yet and therefore,
               the query needs to know that new data has arrived. On subsequent updates, the cache is updated automatically */
        return (
          <BHMutation<CreateProductFeedback, CreateProductFeedbackVariables>
            refetchQueries={['QueryQuestionnaireData']}
            mutation={MUTATE_CREATE_CAMPAIGN_DRAFT_PRODUCT_FEEDBACK}
            onCompleted={data => {
              const questionnaireId = getProp(data)
                .on('campaignDraftProductFeedbackCreate')
                .onValue('questionnaire')
                .on('id')
                .get();
              const questionnaireVersion = getProp(data)
                .on('campaignDraftProductFeedbackCreate')
                .onValue('questionnaire')
                .on('version')
                .get();

              if (
                questionnaireId &&
                questionnaireVersion &&
                (includeMultipleChoiceQuestions || includeRatingQuestions)
              ) {
                setQuestionnaireQuestions({
                  variables: {
                    multipleChoiceQuestions: includeMultipleChoiceQuestions ? multipleChoiceQuestions : [],
                    ratingQuestions: includeRatingQuestions ? ratingQuestions : [],
                    questionnaireId,
                    questionnaireVersion,
                  },
                });
              }
            }}
          >
            {createProductFeedback => {
              return (
                <BaseDialog
                  title="Manage rating and questions"
                  submitText="Save"
                  onSubmit={() => {
                    if (questionnaireInformation) {
                      const questionnaireId = questionnaireInformation.id;
                      const questionnaireVersion = questionnaireInformation.version;

                      setQuestionnaireQuestions({
                        variables: {
                          multipleChoiceQuestions: includeMultipleChoiceQuestions ? multipleChoiceQuestions : [],
                          ratingQuestions: includeRatingQuestions ? ratingQuestions : [],
                          questionnaireId,
                          questionnaireVersion,
                        },
                      });
                    } else if (includeMultipleChoiceQuestions || includeRatingQuestions) {
                      createProductFeedback({ variables: { campaignDraftId } });
                    }
                    closeDialog();
                  }}
                  onClose={() => {
                    resetState();
                    closeDialog();
                  }}
                  {...dialogProps}
                >
                  <BHQuery<QueryQuestionnaireData, QueryQuestionnaireDataVariables>
                    query={QUERY_QUESTIONNAIRE_DATA}
                    variables={{ campaignDraftId }}
                    notifyOnNetworkStatusChange={true}
                  >
                    {({ data, networkStatus, loading }) => {
                      initialize(data, networkStatus);

                      if (loading) {
                        return <Loading />;
                      }

                      const addMultipleChoiceQuestion = (questionText: string) => {
                        setMultipleChoiceQuestions([
                          ...multipleChoiceQuestions,
                          {
                            text: questionText,
                            options: [],
                            order: multipleChoiceQuestions.length + 1,
                          },
                        ]);
                      };

                      const editMultipleChoiceQuestion = (
                        questionToEdit: MultipleChoiceQuestion,
                        newQuestionText: string,
                      ) => {
                        setMultipleChoiceQuestions(
                          editQuestion(questionToEdit, multipleChoiceQuestions, newQuestionText),
                        );
                      };

                      const removeMultipleChoiceQuestion = (questionToRemove: MultipleChoiceQuestion) => {
                        setMultipleChoiceQuestions(removeQuestion(questionToRemove, multipleChoiceQuestions));
                      };

                      const addRatingQuestion = (questionText: string) => {
                        setRatingQuestions([
                          ...ratingQuestions,
                          { text: questionText, order: ratingQuestions.length + 1 },
                        ]);
                      };

                      const editRatingQuestion = (questionToEdit: RatingQuestion, newQuestionText: string) => {
                        setRatingQuestions(editQuestion(questionToEdit, ratingQuestions, newQuestionText));
                      };

                      const removeRatingQuestion = (questionToRemove: RatingQuestion) => {
                        setRatingQuestions(removeQuestion(questionToRemove, ratingQuestions));
                      };

                      const addOption = createAddToFn(multipleChoiceQuestions, setMultipleChoiceQuestions);
                      const removeOption = createRemoveOptionFn(multipleChoiceQuestions, setMultipleChoiceQuestions);
                      const editOption = createEditOptionFn(multipleChoiceQuestions, setMultipleChoiceQuestions);
                      return (
                        <Grid container={true} spacing={1}>
                          <Grid item={true} xs={12}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  color="primary"
                                  checked={includeMultipleChoiceQuestions}
                                  onChange={() => setIncludeMultipleChoiceQuestions(!includeMultipleChoiceQuestions)}
                                />
                              }
                              label="Enable multiple choice questions for this campaign"
                            />
                            {includeMultipleChoiceQuestions && (
                              <MultipleChoiceQuestions
                                addMultipleChoiceQuestion={addMultipleChoiceQuestion}
                                editMultipleChoiceQuestion={editMultipleChoiceQuestion}
                                removeMultipleChoiceQuestion={removeMultipleChoiceQuestion}
                                addOption={addOption}
                                editOption={editOption}
                                removeOption={removeOption}
                                multipleChoiceQuestions={multipleChoiceQuestions}
                              />
                            )}
                          </Grid>
                          <Grid item={true} xs={12}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  color="primary"
                                  checked={includeRatingQuestions}
                                  onChange={() => setIncludeRatingQuestions(!includeRatingQuestions)}
                                />
                              }
                              label="Enable rating questions for this campaign"
                            />
                            {includeRatingQuestions && (
                              <RatingQuestions
                                addRatingQuestion={addRatingQuestion}
                                editRatingQuestion={editRatingQuestion}
                                removeRatingQuestion={removeRatingQuestion}
                                ratingQuestions={ratingQuestions}
                              />
                            )}
                          </Grid>
                        </Grid>
                      );
                    }}
                  </BHQuery>
                </BaseDialog>
              );
            }}
          </BHMutation>
        );
      }}
    </BHMutation>
  );
};

const MUTATE_CREATE_CAMPAIGN_DRAFT_PRODUCT_FEEDBACK = gql`
  mutation CreateProductFeedback($campaignDraftId: ID!) {
    campaignDraftProductFeedbackCreate(campaignDraftId: $campaignDraftId) {
      id
      version
      questionnaire {
        value {
          id
          version
          multipleChoiceQuestions {
            value {
              id
              ...MultipleChoiceQuestion_data
            }
          }
          ratingQuestions {
            value {
              id
              ...RatingQuestion_data
            }
          }
        }
      }
    }
  }
  ${MultipleChoiceQuestionFragment}
  ${RatingQuestionFragment}
`;

const MUTATE_QUESTIONNAIRE_SET_QUESTIONS = gql`
  mutation SetQuestionnaireQuestions(
    $questionnaireId: ID!
    $questionnaireVersion: Int!
    $multipleChoiceQuestions: [MultipleChoiceQuestion!]!
    $ratingQuestions: [RatingQuestion!]!
  ) {
    campaignDraftQuestionnaireSetQuestions(
      campaignDraftQuestionnaireId: $questionnaireId
      campaignDraftQuestionnaireVersion: $questionnaireVersion
      multipleChoiceQuestions: $multipleChoiceQuestions
      ratingQuestions: $ratingQuestions
    ) {
      id
      version
      multipleChoiceQuestions {
        value {
          id
          ...MultipleChoiceQuestion_data
        }
      }
      ratingQuestions {
        value {
          id
          ...RatingQuestion_data
        }
      }
    }
  }
  ${MultipleChoiceQuestionFragment}
  ${RatingQuestionFragment}
`;

const QUERY_QUESTIONNAIRE_DATA = gql`
  query QueryQuestionnaireData($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      productFeedback {
        value {
          id
          version
          questionnaire {
            value {
              id
              version
              multipleChoiceQuestions {
                value {
                  id
                  ...MultipleChoiceQuestion_data
                }
              }
              ratingQuestions {
                value {
                  id
                  ...RatingQuestion_data
                }
              }
            }
          }
        }
      }
    }
  }
  ${MultipleChoiceQuestionFragment}
  ${RatingQuestionFragment}
`;

export default ManageRatingsAndMultipleChoiceQuestionsDialog;
