"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthManager = void 0;
typescript;
const events_1 = require("events");
const IAuthManager_1 = require("./interfaces/IAuthManager");
const IAuthProcess_1 = require("./interfaces/IAuthProcess");
const IAuthProcessFactory_1 = require("./interfaces/IAuthProcessFactory");
const interfaces_1 = require("../interfaces");
/**
 * Manages multiple authentication processes, one per connection ID.
 */
class AuthManager extends events_1.EventEmitter {
    constructor(factory, logger) {
        super();
        this.factory = factory;
        this.logger = logger;
        this.processes = new Map();
    }
    startAuthentication(connectionId, isInitiator, sendMessage) {
        this.cleanupConnection(connectionId); // Ensure no stale process exists
        this.logger.info(`[AuthManager] Creating auth process for ${connectionId}`);
        const process = this.factory.create(connectionId, isInitiator, sendMessage, this.logger);
        // Forward events from the process
        process.on('authenticated', (id) => this.emit('authenticated', id));
        process.on('failed', (id, reason) => this.emit('authFailed', id, reason));
        // Listen for failure to clean up the map entry
        process.once('failed', (id) => this.processes.delete(id));
        process.once('authenticated', (id) => this.processes.delete(id)); // Also remove on success
        this.processes.set(connectionId, process);
        process.start();
    }
    handleMessage(connectionId, message) {
        const process = this.processes.get(connectionId);
        if (process) {
            try {
                // Attempt to parse if message is string, otherwise assume object
                const parsedMessage = typeof message === 'string' ? JSON.parse(message) : message;
                process.handleMessage(parsedMessage);
            }
            catch (e) {
                this.logger.error(`[AuthManager] Failed to parse or handle message for ${connectionId}: ${e?.message}`);
                process.abort(`Invalid message format: ${e?.message}`);
                this.processes.delete(connectionId); // Clean up on parse error
            }
        }
        else {
            this.logger.warn(`[AuthManager] Received message for unknown/inactive auth process: ${connectionId}`);
        }
    }
    cleanupConnection(connectionId) {
        const process = this.processes.get(connectionId);
        if (process) {
            this.logger.info(`[AuthManager] Cleaning up auth process for ${connectionId}`);
            process.removeAllListeners(); // Prevent event leaks
            process.abort('Connection cleanup requested');
            this.processes.delete(connectionId);
        }
    }
}
exports.AuthManager = AuthManager;
END_TEST_FILE;
Summary;
of;
Refactoring;
authService.ts;
SRP: AuthProcess: Handles;
the;
state;
machine, protocol;
logic, and;
timeout;
for (a; single; connection)
    's authentication attempt.;
AuthManager: Manages;
the;
collection;
of;
active;
AuthProcess;
instances, routing;
messages, starting / cleaning;
up;
processes, and;
forwarding;
events.
    AuthProcessFactory;
Solely;
responsible;
for (creating; AuthProcess; instances.
    NodeTimer)
    : Handles;
timer;
operations.
    OCP;
The;
AuthManager_1.AuthManager;
depends;
on;
IAuthProcessFactory_1.IAuthProcessFactory;
and;
IAuthProcess_1.IAuthProcess, allowing;
different;
factory;
or;
process;
implementations(e.g., a, different, auth, protocol);
without;
modifying;
the;
manager.
;
The;
AuthProcess;
depends;
on;
ITimer_1.ITimer, allowing;
different;
timer;
implementations(e.g.);
for (testing;;)
    .
        LSP;
Concrete;
classes;
implement;
their;
interfaces;
correctly.
    ISP;
Interfaces;
are;
focused(IAuthProcess_1.IAuthProcess, IAuthManager_1.IAuthManager, ITimer_1.ITimer).
    DIP;
Dependencies(interfaces_1.ILogger, IAuthProcessFactory_1.IAuthProcessFactory, ITimer_1.ITimer, sendMessage, callback);
are;
injected.High - level;
AuthManager_1.AuthManager;
depends;
on;
abstractions(IAuthProcess_1.IAuthProcess, IAuthProcessFactory_1.IAuthProcessFactory).
;
File;
Size: All;
new files;
are;
well;
under;
the;
80 - line;
limit.
;
State;
Management: State;
is;
now;
encapsulated;
within;
individual;
AuthProcess;
instances, simplifying;
the;
AuthManager_1.AuthManager.
;
User;
Interaction: The;
original;
code;
mentioned;
states;
like;
WAITING_FOR_USER_INPUT.This;
logic;
wasn;
't fully present in the provided snippet but would ideally be handled by injecting an IUserInteraction dependency into AuthProcess if needed, keeping that concern separate.;
You;
would;
now;
replace;
the;
instantiation;
of;
the;
old;
AuthService;
with (the)
    new AuthManager_1.AuthManager, providing;
it;
with (an)
    AuthProcessFactory: typescript;
// In your composition root (e.g., extension.ts)
const AuthManager_1 = require("./auth/AuthManager");
const AuthProcessFactory_1 = require("./auth/AuthProcessFactory");
// ... instantiate logger ...
const authProcessFactory = new AuthProcessFactory_1.AuthProcessFactory( /* provide ITimer if needed */);
const authManager = new AuthManager_1.AuthManager(authProcessFactory, logger);
// Now, components that previously used AuthService will use authManager
// e.g., ConnectionHandler would call authManager.startAuthentication(...)
// and pass incoming messages via authManager.handleMessage(...)
Rate;
this;
answer: Phazzie;
Zee;
const vscode = __importStar(require("vscode"));
const constants_1 = require("./constants");
/**

Authentication state enum */ var AuthState;
(function (AuthState) {
    AuthState["IDLE"] = "IDLE";
    AuthState["WAITING_FOR_CHALLENGE"] = "WAITING_FOR_CHALLENGE";
    AuthState["WAITING_FOR_RESPONSE"] = "WAITING_FOR_RESPONSE";
    AuthState["WAITING_FOR_VALIDATION"] = "WAITING_FOR_VALIDATION";
    AuthState["AUTHENTICATED"] = "AUTHENTICATED";
    AuthState["FAILED"] = "FAILED";
})(AuthState || (AuthState = {}));
state: AuthState = AuthState.IDLE;
animalNames: string[] = [];
authTimeout: NodeJS.Timeout | null;
null;
outputChannel: vscode.OutputChannel;
sendMessageFn: (message) => boolean;
isInitiator: boolean;
/**

Creates a new authentication handler

@param sendMessageFn Function to send messages to the peer

@param outputChannel Output channel for logging

@param isInitiator Whether this side initiated the authentication */ constructor(sendMessageFn, (message) => boolean, outputChannel, vscode.OutputChannel, isInitiator, boolean);
{
    super();
    this.sendMessageFn = sendMessageFn;
    this.outputChannel = outputChannel;
    this.isInitiator = isInitiator;
    // Set timeout for authentication this.authTimeout = setTimeout(() => { this.handleTimeout(); }, AUTH.TIMEOUT);
    this.log(Created, auth, handler(initiator, $, { isInitiator }));
    handleMessage(message, any);
    boolean;
    {
        try { // Check if it's an auth message if (!message || !message.type || !message.type.startsWith('AUTH_')) { return false; }
            plaintext: 15;
            lines;
        }
        catch (err) {
            this.log(Error, handling, message, $, { err });
            return false;
        }
    }
    cancelAuthentication();
    void { this: .clearTimeout(), this: .state = AuthState.FAILED, this: .log('Authentication cancelled'), this: .emit('authFailed', 'Authentication cancelled') };
    provideAnimalNames(animalNames, string[] | null);
    void {
        if(, animalNames) { this.failAuthentication('User cancelled animal name input'); return; },
        if(animalNames) { }, : .length !== constants_1.AUTH.REQUIRED_ANIMALS
    };
    {
        this.failAuthentication(Expected, $, { AUTH: constants_1.AUTH, : .REQUIRED_ANIMALS }, animal, names, got, $, { animalNames, : .length });
        return;
    }
    if (this.state === AuthState.WAITING_FOR_RESPONSE) { // We're the server, store the names for validation this.animalNames = animalNames; this.sendAuthResponse(animalNames); this.state = AuthState.WAITING_FOR_VALIDATION; } else if (this.state === AuthState.WAITING_FOR_VALIDATION) { // We're the client, validate the response const isValid = this.validateAnimalNames(animalNames); if (isValid) { this.sendAuthSuccess(); this.succeedAuthentication(); } else { this.sendAuthFailure('Invalid animal names'); this.failAuthentication('Invalid animal names'); } } else { this.log(Unexpected animal names in state ${this.state}); } }
        handleAuthRequest();
        boolean;
        {
            if (this.state !== AuthState.WAITING_FOR_CHALLENGE) {
                this.log(Unexpected, AUTH_REQ in state, $, { this: .state });
                return false;
            }
            this.state = AuthState.WAITING_FOR_RESPONSE;
            this.log('Received challenge, prompting for animal names');
            this.emit('promptForAnimalNames', 'Enter animal names for authentication');
            return true;
        }
        handleAuthResponse(payload, string[]);
        boolean;
        {
            if (this.state !== AuthState.WAITING_FOR_RESPONSE && this.state !== AuthState.WAITING_FOR_VALIDATION) {
                this.log(Unexpected, AUTH_RESP in state, $, { this: .state });
                return false;
            }
            if (!Array.isArray(payload) || payload.length !== constants_1.AUTH.REQUIRED_ANIMALS) {
                this.sendAuthFailure(Expected, $, { AUTH: constants_1.AUTH, : .REQUIRED_ANIMALS }, animal, names, got, $, { payload, : .length });
                this.failAuthentication(Expected, $, { AUTH: constants_1.AUTH, : .REQUIRED_ANIMALS }, animal, names, got, $, { payload, : .length });
                return true;
            }
            if (this.isInitiator) { // We're the client, store the names and prompt for validation this.animalNames = payload; this.state = AuthState.WAITING_FOR_VALIDATION; this.log('Received response, prompting for validation'); this.emit('promptForAnimalNames', 'Enter animal names to validate the peer', true); } else { // We're the server, validate the response const isValid = this.validateAnimalNames(payload); if (isValid) { this.sendAuthSuccess(); this.succeedAuthentication(); } else { this.sendAuthFailure('Invalid animal names'); this.failAuthentication('Invalid animal names'); } }
                return true;
            }
            handleAuthSuccess();
            boolean;
            {
                if (this.state !== AuthState.WAITING_FOR_VALIDATION) {
                    this.log(Unexpected, AUTH_SUCCESS in state, $, { this: .state });
                    return false;
                }
                this.succeedAuthentication();
                return true;
            }
            handleAuthFailure(reason, string);
            boolean;
            {
                this.failAuthentication(reason || 'Authentication failed');
                return true;
            }
            sendChallenge();
            void { this: .state = AuthState.WAITING_FOR_RESPONSE, this: .log('Sending challenge'), this: .sendAuthMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ), this: .emit('promptForAnimalNames', 'Enter animal names for authentication') };
            sendAuthResponse(animalNames, string[]);
            void { this: .log('Sending response'), this: .sendAuthMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP, animalNames) };
            sendAuthSuccess();
            void { this: .log('Sending success'), this: .sendAuthMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_SUCCESS) };
            sendAuthFailure(reason, string);
            void { this: .log(Sending, failure, $, { reason }), this: .sendAuthMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_FAIL, reason) };
            sendAuthMessage(type, string, payload ?  : any);
            void { const: message = { type, payload }, this: .sendMessageFn(JSON.stringify(message)) };
            validateAnimalNames(animalNames, string[]);
            boolean;
            {
                if (!Array.isArray(animalNames) || animalNames.length !== constants_1.AUTH.REQUIRED_ANIMALS) {
                    return false;
                }
                // Compare the animal names (case-insensitive) for (let i = 0; i < AUTH.REQUIRED_ANIMALS; i++) { if (animalNames[i].toLowerCase() !== this.animalNames[i].toLowerCase()) { return false; } }
                return true;
            }
            handleTimeout();
            void { this: .authTimeout = null, this: .failAuthentication('Authentication timed out') };
            clearTimeout();
            void { : .authTimeout };
            {
                clearTimeout(this.authTimeout);
                this.authTimeout = null;
            }
        }
        succeedAuthentication();
        void { this: .clearTimeout(), this: .state = AuthState.AUTHENTICATED, this: .log('Authentication successful'), this: .emit('authSucceeded') };
        failAuthentication(reason, string);
        void { this: .clearTimeout(), this: .state = AuthState.FAILED, this: .log(Authentication, failed, $, { reason }), this: .emit('authFailed', reason) };
        log(message, string);
        void { this: .outputChannel.appendLine([AuthHandler], $, { message }) };
    }
    Gemini;
    Okay, let;
    's take a look at this AuthHandler class. It manages a specific "animal names" authentication protocol, handling state, messages, timeouts, and user interaction prompts.;
    Overall, the;
    code;
    is;
    quite;
    clear in its;
    intent;
    and;
    uses;
    a;
    state;
    let ;
    (function () {
    })( || ( = {}));
    (AuthState), which;
    is;
    good;
    practice;
    for (managing; distinct; phases)
        of;
    the;
    process.However, there;
    are;
    several;
    areas;
    where;
    we;
    can;
    enhance;
    its;
    quality, clarity, and;
    adherence;
    to;
    SOLID;
    principles, particularly;
    regarding;
    dependency;
    management;
    and;
    separation;
    of;
    concerns.
    ;
    Here;
    are;
    some;
    observations;
    and;
    suggestions: Dependency;
    Inversion(DIP) & Testability;
    Logger: The;
    class directly {
    }
    depends;
    on;
    vscode.OutputChannel.This;
    makes;
    the;
    class harder {
    }
    to;
    test;
    outside;
    of;
    a;
    VS;
    Code;
    environment;
    and;
    couples;
    it;
    directly;
    to;
    VS;
    Code;
    's API. It would be better to inject a generic logger interface (like the ILogger used in the previous context).;
    Timer: Direct;
    use;
    of;
    setTimeout;
    and;
    clearTimeout;
    makes;
    testing;
    time - dependent;
    logic;
    difficult.Injecting;
    a;
    simple;
    ITimer_1.ITimer;
    interface(as, suggested, previously);
    would;
    allow;
    you;
    to;
    mock;
    time in tests.
    ;
    Message;
    Sending: The;
    sendMessageFn;
    function type() { }
    is;
    okay, but;
    injecting;
    an;
    IMessageSender;
    could;
    be;
    slightly;
    more;
    robust;
    if (message)
        sending;
    involves;
    more;
    complex;
    logic;
    or;
    different;
    transport;
    mechanisms in the;
    future.
        typescript;
    // Example: Injecting ILogger and ITimer
    import { ILogger } from '../interfaces'; // Assuming common interface path
    import { ITimer } from './interfaces/ITimer'; // Assuming interface exists
    export class AuthHandler extends events_1.EventEmitter {
        constructor(sendMessageFn, logger, // Inject ILogger
        timer, // Inject ITimer
        isInitiator) {
            super();
            this.authTimeoutHandle = null; // Keep using NodeJS.Timeout or use a generic handle type from ITimer
            this.sendMessageFn = sendMessageFn;
            this.logger = logger; // Use injected logger
            this.timer = timer; // Use injected timer
            this.isInitiator = isInitiator;
            // Use injected timer
            this.authTimeoutHandle = this.timer.set(() => {
                this.handleTimeout();
            }, constants_1.AUTH.TIMEOUT);
            this.log(`Created auth handler (initiator: ${isInitiator})`);
            // ... rest of constructor
        }
        // Use injected logger
        log(message) {
            this.logger.info(`[AuthHandler] ${message}`); // Or logger.debug, etc.
        }
        // Use injected timer
        clearTimeout() {
            this.timer.clear(this.authTimeoutHandle);
            this.authTimeoutHandle = null;
        }
    }
    Single;
    Responsibility;
    Principle(SRP);
    The;
    class currently {
    }
    manages;
    the;
    state;
    machine, handles;
    the;
    specific;
    "animal names";
    protocol;
    logic(sending / receiving, messages), triggers;
    user;
    interaction(emit('promptForAnimalNames')), manages;
    timeouts, performs;
    validation(validateAnimalNames), and;
    handles;
    logging.
    ;
    Consider;
    extracting;
    the;
    validateAnimalNames;
    logic;
    into;
    a;
    separate;
    function or() { }
    even;
    a;
    dedicated;
    AnimalNamesValidator;
    class {
    }
    especially;
    if (the)
        validation;
    rules;
    become;
    more;
    complex.
    ;
    The;
    responsibility;
    for (prompting; the; user)
        could;
    potentially;
    be;
    separated.This;
    handler;
    could;
    emit;
    a;
    more;
    generic;
    event;
    like;
    userInputRequired;
    with (context, and)
        another;
    component;
    responsible;
    for (UI; interaction; could)
        listen;
    for (this; and; use)
        vscode.window.showInputBox.
        ;
    State;
    Management;
    Complexity: The;
    combination;
    of;
    switch (statements in handleMessage) {
    }
    and;
    if (conditions)
        checking;
    this.state;
    within;
    handlers;
    and;
    provideAnimalNames;
    works;
    but;
    can;
    become;
    harder;
    to;
    follow;
    protocol;
    grows.
    ;
    For;
    more;
    complex;
    protocols, you;
    might;
    consider;
    a;
    more;
    formal;
    State;
    Pattern;
    where;
    each;
    state;
    is;
    represented;
    by;
    its;
    own;
    class {
    }
    handling;
    messages;
    and;
    transitions;
    specific;
    to;
    that;
    state.However, ;
    for (this; relatively; simple)
        protocol, the;
    current;
    approach;
    might;
    be;
    acceptable;
    if (kept)
        clean.
        ;
    Clarity in provideAnimalNames;
    This;
    method;
    handles;
    input;
    differently;
    based;
    on;
    whether;
    the;
    handler;
    is in WAITING_FOR_RESPONSE(acting);
    or;
    WAITING_FOR_VALIDATION(acting).Adding;
    comments;
    to;
    clarify;
    the;
    roles in these;
    branches;
    could;
    improve;
    readability.
    ;
    Constants;
    for (Events; ; )
        : You;
    're using constants for message types (AUTH.MESSAGE_TYPES), which is great. Consider doing the same for the emitted event names (';
    promptForAnimalNames;
    ', ';
    authSucceeded;
    ', ';
    authFailed;
    ') to avoid magic strings.;
    typescript;
    // Example: Event constants
    export const AuthHandlerEvents = {
        PROMPT_FOR_NAMES: 'promptForAnimalNames',
        AUTH_SUCCEEDED: 'authSucceeded',
        AUTH_FAILED: 'authFailed',
    }; // Use 'as const' for stricter typing
    // Usage:
    this.emit(AuthHandlerEvents.PROMPT_FOR_NAMES, 'Enter animal names...');
    this.emit(AuthHandlerEvents.AUTH_SUCCEEDED);
    this.emit(AuthHandlerEvents.AUTH_FAILED, reason);
    Error;
    Handling in sendAuthMessage;
    The;
    sendAuthMessage;
    method;
    stringifies;
    the;
    message;
    but;
    doesn;
    't handle potential errors during stringification (though unlikely for simple objects). It also relies on the sendMessageFn callback to indicate success/failure but doesn';
    t;
    explicitly;
    react;
    if (sendMessageFn)
        returns;
    false.Depending;
    on;
    the;
    transport;
    reliability, you;
    might;
    need;
    more;
    robust;
    handling;
    here.
    ;
    By;
    applying;
    dependency;
    injection;
    for (logging; and; timers, you)
        'll significantly improve the testability and decoupling of this class. Further separating validation or user interaction logic could enhance adherence to SRP if the complexity warrants it.;
}
//# sourceMappingURL=%20AuthManager.js.map