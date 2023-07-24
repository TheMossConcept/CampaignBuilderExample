import { gql } from '@apollo/client';
import { Accordion, AccordionSummary, Grid } from '@material-ui/core';
import React, { FC } from 'react';

import { RatingQuestion } from '../../../../__generated__/types';
import AddElement from './AddElement';
import Question from './Question';

interface IRatingQuestions {
  addRatingQuestion: (questionText: string) => void;
  editRatingQuestion?: (questionToEdit: RatingQuestion, newQuestionText: string) => void;
  removeRatingQuestion?: (questionToRemove: RatingQuestion) => void;
  ratingQuestions: RatingQuestion[];
}

type Props = IRatingQuestions;

const RatingQuestions: FC<Props> = ({
  ratingQuestions,
  addRatingQuestion,
  editRatingQuestion,
  removeRatingQuestion,
}) => {
  return (
    <Grid container={true} spacing={2}>
      <Grid item={true} xs={12}>
        {ratingQuestions.map((ratingQuestion, index) => (
          // Use an Accordion for UI consistency, but it can never be expanded (thus, expanded={false}) because there is no details to show
          <Accordion expanded={false} key={`${ratingQuestion.text}${index}`}>
            <AccordionSummary>
              <Question
                question={ratingQuestion}
                edit={
                  editRatingQuestion
                    ? (newQuestionText: string) => {
                        editRatingQuestion(ratingQuestion, newQuestionText);
                      }
                    : undefined
                }
                remove={removeRatingQuestion ? () => removeRatingQuestion(ratingQuestion) : undefined}
              />
            </AccordionSummary>
          </Accordion>
        ))}
      </Grid>
      <Grid item={true} xs={12}>
        <AddElement
          add={addRatingQuestion}
          addLabel="Add rating question"
          disabled={ratingQuestions ? ratingQuestions.length >= 1 : false}
          disabledMessage="You can only add one rating question"
        />
      </Grid>
    </Grid>
  );
};

export const RatingQuestionFragment = gql`
  fragment RatingQuestion_data on CampaignDraftQuestionnaireRatingQuestion {
    id
    version
    text {
      value
    }
    order {
      value
    }
    disabled {
      value
    }
  }
`;

export default RatingQuestions;
