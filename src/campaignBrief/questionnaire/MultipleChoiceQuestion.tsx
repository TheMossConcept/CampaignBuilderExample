import { gql } from '@apollo/client';
import { Accordion, AccordionDetails, AccordionSummary, Grid, makeStyles } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import React, { FC, MouseEvent, useState } from 'react';

import { MultipleChoiceQuestion, MultipleChoiceQuestionOption } from '../../../../__generated__/types';
import BHSpacer from '../../../common/BHSpacer';
import AddElement from './AddElement';
import Option from './Option';
import Question from './Question';

interface IMultipleChoiceQuestions {
  addMultipleChoiceQuestion: (questionText: string) => void;
  editMultipleChoiceQuestion?: (questionToEdit: MultipleChoiceQuestion, newQuestionText: string) => void;
  removeMultipleChoiceQuestion?: (questionToRemove: MultipleChoiceQuestion) => void;
  addOption: (questionToAddTo: MultipleChoiceQuestion, optionText: string) => void;
  editOption?: (
    optionToEdit: MultipleChoiceQuestionOption,
    questionToEdit: MultipleChoiceQuestion,
    newOptionText: string,
  ) => void;
  removeOption?: (questionToRemoveFrom: MultipleChoiceQuestion, optionToRemove: MultipleChoiceQuestionOption) => void;
  multipleChoiceQuestions: MultipleChoiceQuestion[];
}

type Props = IMultipleChoiceQuestions;

const useStyles = makeStyles({
  subListItem: {
    paddingLeft: '48px',
    paddingRight: '8px',
    paddingBottom: '0px',
  },
  bottomSublistItem: {
    paddingLeft: '48px',
    paddingRight: '8px',
  },
  expansionlistRoot: { width: '100%' },
});

const MultipleChoiceQuestions: FC<Props> = ({
  addMultipleChoiceQuestion,
  editMultipleChoiceQuestion,
  removeMultipleChoiceQuestion,
  addOption,
  editOption,
  removeOption,
  multipleChoiceQuestions,
}) => {
  const [showMultipleChoiceOptions, setShowMultipleChoiceOptions] = useState<{ [id: string]: boolean }>({});
  const classes = useStyles();

  return (
    <div className={classes.expansionlistRoot}>
      {multipleChoiceQuestions.map((multipleChoiceQuestion, index) => {
        const questionDisplayId = `${multipleChoiceQuestion.text}${index}`;
        const showOptions = showMultipleChoiceOptions[questionDisplayId];

        return (
          <Accordion
            key={questionDisplayId}
            expanded={showOptions}
            onChange={(_, isExpanded: boolean) =>
              setShowMultipleChoiceOptions({ ...showMultipleChoiceOptions, [questionDisplayId]: !isExpanded })
            }
          >
            <AccordionSummary key={questionDisplayId} expandIcon={<ExpandMoreIcon />}>
              <Question
                question={multipleChoiceQuestion}
                edit={
                  editMultipleChoiceQuestion
                    ? (newQuestionText: string) => editMultipleChoiceQuestion(multipleChoiceQuestion, newQuestionText)
                    : undefined
                }
                remove={
                  removeMultipleChoiceQuestion ? () => removeMultipleChoiceQuestion(multipleChoiceQuestion) : undefined
                }
                // Otherwise, the expansion panel will open and close each time the text field is pressed to select the text
                onTextFieldClick={(event: MouseEvent<HTMLInputElement>) => event.stopPropagation()}
              />
            </AccordionSummary>
            <Grid container={true} spacing={1}>
              {multipleChoiceQuestion.options
                ? multipleChoiceQuestion.options.map(option => {
                    const optionDisplayId = `${option.text}${option.order}${multipleChoiceQuestion.text}${multipleChoiceQuestion.order}`;
                    return (
                      <Option
                        option={option}
                        key={optionDisplayId}
                        classes={{ root: classes.subListItem }}
                        editOption={
                          editOption
                            ? (newOptionText: string) => {
                                editOption(multipleChoiceQuestion, option, newOptionText);
                              }
                            : undefined
                        }
                        deleteOption={removeOption ? () => removeOption(multipleChoiceQuestion, option) : undefined}
                      />
                    );
                  })
                : null}
              <Grid item={true} xs={12}>
                <AccordionDetails classes={{ root: classes.bottomSublistItem }}>
                  <AddElement
                    add={(textToAdd: string) => addOption(multipleChoiceQuestion, textToAdd)}
                    addLabel="Add option"
                    disabled={multipleChoiceQuestion.options ? multipleChoiceQuestion.options.length >= 3 : false}
                    disabledMessage="You can only add three options to a multiple-choice question"
                  />
                </AccordionDetails>
              </Grid>
            </Grid>
          </Accordion>
        );
      })}
      <BHSpacer />
      <Grid item={true} xs={12}>
        <AddElement
          add={addMultipleChoiceQuestion}
          addLabel="Add multiple choice question"
          disabled={multipleChoiceQuestions ? multipleChoiceQuestions.length >= 1 : false}
          disabledMessage="You can only add one multiple-choice question"
        />
      </Grid>
    </div>
  );
};

export const MultipleChoiceQuestionFragment = gql`
  fragment MultipleChoiceQuestion_data on CampaignDraftQuestionnaireMultipleChoiceQuestion {
    id
    version
    text {
      value
    }
    disabled {
      value
    }
    options {
      value {
        id
        text {
          value
        }
        order {
          value
        }
      }
    }
    order {
      value
    }
  }
`;

export default MultipleChoiceQuestions;
