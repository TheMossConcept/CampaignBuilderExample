import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';

import { MultipleChoiceQuestion, MultipleChoiceQuestionOption, RatingQuestion } from '../../../../__generated__/types';
import {
  QueryQuestionnaireData_campaignDraft_productFeedback_value_questionnaire_value_multipleChoiceQuestions_value,
  QueryQuestionnaireData_campaignDraft_productFeedback_value_questionnaire_value_ratingQuestions_value,
} from './__generated__/QueryQuestionnaireData';

export const questionReducer = (
  existingMultipleChoiceQuestions?:
    | QueryQuestionnaireData_campaignDraft_productFeedback_value_questionnaire_value_multipleChoiceQuestions_value[]
    | null,
) => {
  if (!isDefined(existingMultipleChoiceQuestions)) {
    return [];
  }
  return existingMultipleChoiceQuestions.reduce<MultipleChoiceQuestion[]>((accumulator, existingQuestion) => {
    const optionValues = getProp(existingQuestion)
      .onValue('options')
      .get();

    const text = getProp(existingQuestion)
      .onValue('text')
      .get();
    const order = getProp(existingQuestion)
      .onValue('order')
      .get();
    const disabled = getProp(existingQuestion)
      .onValue('disabled')
      .get();
    const options =
      optionValues &&
      optionValues.reduce<MultipleChoiceQuestionOption[]>((acc, cur) => {
        const text = getProp(cur)
          .onValue('text')
          .get();
        const order = getProp(cur)
          .onValue('order')
          .get();
        return isDefined(text) && isDefined(order) ? [...acc, { text, order }] : acc;
      }, []);

    // Don't include disabled questions
    return isDefined(text) && isDefined(order) && isDefined(options) && disabled !== true
      ? [...accumulator, { text, order, options }]
      : accumulator;
  }, []);
};

export const ratingReducer = (
  existingRatingQuestions?:
    | QueryQuestionnaireData_campaignDraft_productFeedback_value_questionnaire_value_ratingQuestions_value[]
    | null,
) => {
  if (!isDefined(existingRatingQuestions)) {
    return [];
  }
  return existingRatingQuestions.reduce<RatingQuestion[]>((accumulator, existingQuestion) => {
    const text = getProp(existingQuestion)
      .onValue('text')
      .get();
    const order = getProp(existingQuestion)
      .onValue('order')
      .get();
    const disabled = getProp(existingQuestion)
      .onValue('disabled')
      .get();

    // Don't include disabled questions
    return isDefined(text) && isDefined(order) && disabled !== true ? [...accumulator, { text, order }] : accumulator;
  }, []);
};

// When deleting, we need to preserve the order to avoid UserInputError when saving
function remove<T extends { order: number }>(questionToRemove: T) {
  let hasRemovedElement = false;
  return (accumulator: T[], question: T) => {
    if (question === questionToRemove) {
      hasRemovedElement = true;
      return accumulator;
    }

    if (hasRemovedElement) {
      return [{ ...question, order: question.order - 1 }, ...accumulator];
    } else {
      return [question, ...accumulator];
    }
  };
}

export const editQuestion = (
  questionToEdit: MultipleChoiceQuestion | RatingQuestion,
  inArray: (MultipleChoiceQuestion | RatingQuestion)[],
  newQuestionText: string,
) => {
  return inArray.map(question => {
    if (question === questionToEdit) {
      return { ...question, text: newQuestionText };
    } else {
      return question;
    }
  });
};

export const removeQuestion = (
  questionToRemove: MultipleChoiceQuestion | RatingQuestion,
  fromArray: (MultipleChoiceQuestion | RatingQuestion)[],
): MultipleChoiceQuestion[] | RatingQuestion[] => {
  return fromArray.reduce(remove(questionToRemove), [] as (MultipleChoiceQuestion | RatingQuestion)[]);
};

export const createEditOptionFn = (
  cur: MultipleChoiceQuestion[],
  updateFn: React.Dispatch<MultipleChoiceQuestion[]>,
) => (questionToEdit: MultipleChoiceQuestion, optionToEdit: MultipleChoiceQuestionOption, newOptionText: string) => {
  const newMultipleChoiceQuestions = cur.map(question => {
    if (question.text === questionToEdit.text && question.order === questionToEdit.order) {
      return {
        ...question,
        options: question.options
          ? question.options.map(option => {
              if (option === optionToEdit) {
                return { ...option, text: newOptionText };
              } else {
                return option;
              }
            })
          : question.options,
      };
    } else {
      return question;
    }
  });

  updateFn(newMultipleChoiceQuestions);
};

export const createRemoveOptionFn = (
  values: MultipleChoiceQuestion[],
  updateFn: React.Dispatch<MultipleChoiceQuestion[]>,
) => (questionToRemoveFrom: MultipleChoiceQuestion, optionToRemove: MultipleChoiceQuestionOption) => {
  updateFn(
    values.map(multipleChoiceQuestion => {
      if (multipleChoiceQuestion === questionToRemoveFrom) {
        return {
          ...multipleChoiceQuestion,
          options: multipleChoiceQuestion.options
            ? multipleChoiceQuestion.options.reduce(remove(optionToRemove), [] as MultipleChoiceQuestionOption[])
            : [],
        };
      } else {
        return multipleChoiceQuestion;
      }
    }),
  );
};

export const createAddToFn = (values: MultipleChoiceQuestion[], updateFn: React.Dispatch<MultipleChoiceQuestion[]>) => (
  questionToAddTo: MultipleChoiceQuestion,
  newOptionText: string,
) => {
  updateFn(
    values.map(multipleChoiceQuestion => {
      if (multipleChoiceQuestion === questionToAddTo) {
        const existingOptions = multipleChoiceQuestion.options ? multipleChoiceQuestion.options : [];

        return {
          ...multipleChoiceQuestion,
          options: [...existingOptions, { text: newOptionText, order: existingOptions.length + 1 }],
        };
      } else {
        return multipleChoiceQuestion;
      }
    }),
  );
};
