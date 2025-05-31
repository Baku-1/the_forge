# the_forge
Key Reminders for Firebase Setup:

Install Firebase CLI: npm install -g firebase-tools
Login: firebase login
Initialize Firebase in your project root: firebase init (select Functions - TypeScript, Firestore, Hosting). This will create some of these files for you.
Set Environment Configuration: For production, use firebase functions:config:set ... for all your secrets (Oracle private key, RPC URLs, API keys). Access them in your code via functions.config().
