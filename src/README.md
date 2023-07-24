The campaign builder follows the following architecture:
1) The CampaignBuilder component sets up the skeleton (The top bar, button bar, feedback and validation context which is needed globally, adds in the navigation at the top and adds the individual steps) 
2) Feedback and validation are both handled through context since these concerns are global to the entire campaign builder. Everything related to feedback can be found in CampaignBuilderFeedback. 
 Similarly, everything related to validation can be found in CampaignBuilderValidation
3) The steps in the campaign builder, together with their respective field components, are defined in their own folder
4) Each field has its own component which takes care of querying the initial value of that field and updating the field value through an anemic mutation. 
 In addition, they also, potentially, contain custon logic related to the specific field (e.g. the targetNumberOfPosts field conducts a convertion back and fourth between budget)
5) The CampaignBuilderFormFieldsStateHooks handles all state reuse across fields. It handle validation, registration of mutations in flight for user feedback, debounce and update of validation state 
 when dynamically displayed fields are shown or hidden. As the name indicates, the value returned from this hook should be used in the mutation as it is debounced and only returned if it is valid.
 Also, the set method returned from this hook should be used to update the value as it updates internal field state such as pristine and isInitialValue
6) The field components use generic view components for layout. These are located in the common folder as they are reuseable elsewhere (as opposed to the state hook which is specific for the campaign builder)
7) Similarly, a reuseable useValidation hook is available in the common folder. This one is also used in UpdateCampaignName since that particular field does not auto-update but not in the other fields
since the auto-updating logic and the validation logic are interwined it is unfortunately not possible to use the validation hook in the field state hook. To facilitate code reuse despite of this,
 a doValidation function has been defined which is located together with the useValidation hook
