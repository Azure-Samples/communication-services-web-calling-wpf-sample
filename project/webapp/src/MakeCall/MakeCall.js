import React from "react";
import { CallClient, LocalVideoStream } from '@azure/communication-calling';
import { AzureCommunicationUserCredential } from '@azure/communication-common';
import {
    PrimaryButton,
    TextField,
    MessageBar,
    MessageBarType
} from 'office-ui-fabric-react'
import { Icon } from '@fluentui/react/lib/Icon';
import CallCard from '../MakeCall/CallCard'
import CallEndReasonCard from "./CallEndReasonCard";
import { utils } from '../Utils/Utils';

export default class MakeCall extends React.Component {
    constructor(props) {
        super(props);
        this.callClient = null;
        this.callAgent = null;
        this.deviceManager = null;
        this.destinationUserIds = null;

        this.state = {
            loggedIn: false,
            id: ''
        };
    }

    async componentDidMount() {
        try {
            let response = await fetch('/tokens/provisionUser');
            this.userDetails = await response.json();
            this.setState({ id: utils.getIdentifierText(this.userDetails.user) });
            const tokenCredential = new AzureCommunicationUserCredential(this.userDetails.token);
            this.callClient = new CallClient();
            this.callAgent = await this.callClient.createCallAgent(tokenCredential);
            this.deviceManager = await this.callClient.getDeviceManager();
            await this.deviceManager.askDevicePermission(true, true);
            this.callAgent.on('callsUpdated', e => {
                console.log(`callsUpdated, added=${e.added}, removed=${e.removed}`);

                e.added.forEach(call => {
                    if (this.state.call && call.isIncoming) {
                        call.reject();
                        return;
                    }
                    this.setState({ call: call, callEndReason: undefined })
                });

                e.removed.forEach(call => {
                    if (this.state.call && this.state.call === call) {
                        this.setState({
                            call: null,
                            callEndReason: this.state.call.callEndReason
                        });
                    }
                });
            });
            this.setState({ loggedIn: true });
        } catch (e) {
            console.error(e);
        }
    }

    placeCall = () => {
        try {
            let identitiesToCall = [];
            const userIdsArray = this.destinationUserIds.value.split(',');

            userIdsArray.forEach((userId) => {
                if (userId) {
                    userId = userId.trim();
                    userId = { communicationUserId: userId };
                    if (!identitiesToCall.find(id => { return id === userId })) {
                        identitiesToCall.push(userId);
                    }
                }
            });

            const speakerDevice = this.deviceManager.getSpeakerList()[0];
            if(!speakerDevice || speakerDevice.id === 'speaker:') {
                this.setShowSpeakerNotFoundWarning(true);
            } else if(speakerDevice) {
                this.deviceManager.setSpeaker(speakerDevice);
            }
    
            const microphoneDevice = this.deviceManager.getMicrophoneList()[0];
            if(!microphoneDevice || microphoneDevice.id === 'microphone:') {
                this.setShowMicrophoneNotFoundWarning(true);
            } else {
                this.deviceManager.setMicrophone(microphoneDevice);
            }

            let callOptions = {
                videoOptions: {
                    localVideoStreams: undefined
                },
                audioOptions: {
                    muted: false
                }
            };

            this.callAgent.call(identitiesToCall, callOptions);

        } catch (e) {
            console.log('Failed to place a call', e);
        }
    };

    setShowCameraNotFoundWarning(show) {
        this.setState({showCameraNotFoundWarning: show});
    }

    setShowSpeakerNotFoundWarning(show) {
        this.setState({showSpeakerNotFoundWarning: show});
    }

    setShowMicrophoneNotFoundWarning(show) {
        this.setState({showMicrophoneNotFoundWarning: show});
    }

    render() {
        return (
            <div className="card">
                <div className="ms-Grid">
                    <div className="ms-Grid-row">
                        <h2 className="ms-Grid-col ms-lg6 ms-sm6 mb-4">Place and receive calls</h2>
                    </div>
                    {
                        this.state.loggedIn &&
                        <div>
                            <span>Your User Identity: </span>
                            <span className="identity"><b>{this.state.id}</b></span>
                        </div>
                    }
                    {
                        this.state.showCameraNotFoundWarning && 
                        <MessageBar
                            messageBarType={MessageBarType.warning}
                            isMultiline={false}
                            onDismiss={ () => { this.setShowCameraNotFoundWarning(false) }}
                            dismissButtonAriaLabel="Close">
                            <b>No camera device found!</b>
                        </MessageBar>
                    }
                    {
                        this.state.showSpeakerNotFoundWarning && 
                        <MessageBar
                            messageBarType={MessageBarType.warning}
                            isMultiline={false}
                            onDismiss={ () => { this.setShowSpeakerNotFoundWarning(false) }}
                            dismissButtonAriaLabel="Close">
                            <b>No speaker device found!</b>
                        </MessageBar>
                    }
                    {
                        this.state.showMicrophoneNotFoundWarning && 
                        <MessageBar
                            messageBarType={MessageBarType.warning}
                            isMultiline={false}
                            onDismiss={ () => { this.setShowMicrophoneNotFoundWarning(false) }}
                            dismissButtonAriaLabel="Close">
                            <b>No microphone device found!</b>
                        </MessageBar>
                    }
                    {
                        !this.state.loggedIn &&
                        <div className="custom-row justify-content-center align-items-center mt-4">
                            <div className="loader"> </div>
                            <div className="ml-2">Initializing SDK...</div>
                        </div>
                    }
                    {
                        !this.state.call && this.state.loggedIn &&
                        <div className="ms-Grid-row mt-3">
                            <div className="mb-5 ms-Grid-col ms-sm12 ms-md12 ms-lg4 ms-lgPush4">
                                <h3 className="mb-1">Place a call</h3>
                                <div>Enter a User Identity to make a call to.</div>
                                <div>You can specify multiple Identities to call by using "," separated values.</div>
                                <TextField disabled={this.state.call || !this.state.loggedIn}
                                            label="Destination User Identity"
                                            componentRef={(val) => this.destinationUserIds = val} />
                                <PrimaryButton className="primary-button mt-3" iconProps={{iconName: 'Phone', style: {verticalAlign: 'middle', fontSize: 'large'}}} text="Place call" disabled={this.state.call || !this.state.loggedIn} label="Place call" onClick={this.placeCall}></PrimaryButton>
                            </div>
                        </div>
                    }
                    {
                        this.state.call && this.state.loggedIn && 
                            <CallCard call={this.state.call}
                                        deviceManager={this.deviceManager}
                                        onShowCameraNotFoundWarning={() => {this.setShowCameraNotFoundWarning}}
                                        onShowSpeakerNotFoundWarning={() => {this.setShowSpeakerNotFoundWarning}}
                                        onShowMicrophoneNotFoundWarning={() => {this.setShowMicrophoneNotFoundWarning}}/>
                    }
                    {
                        this.state.callEndReason && this.state.loggedIn &&
                        <CallEndReasonCard callEndReason={this.state.callEndReason} />
                    }
                </div>
            </div>
        );
    }
}