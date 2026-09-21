import { Amplify } from "aws-amplify";
import outputs from "../../amplify_outputs.json";

// Configures Amplify once, as a side effect of importing this module.
Amplify.configure(outputs);
