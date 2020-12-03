import React from "react";
import { DefaultButton } from 'office-ui-fabric-react'
import { Icon } from '@fluentui/react/lib/Icon';
export default class CallCard extends React.Component {
    constructor(props) {
        super(props);
        this.mutePromise = undefined;
        this.state = {
            call: props.call,
            deviceManager: props.deviceManager,
            callState: props.call.state,
            callId: props.call.id,
            micOn: true
        };
    }

    componentWillMount() {
        const onCallStateChanged = () => {
            console.log('callStateChanged', this.state.call.state);
            this.setState({callState: this.state.call.state});
        }
        onCallStateChanged();
        this.state.call.on('callStateChanged', onCallStateChanged);
        this.state.call.on('callIdChanged', () => {
            this.setState({ callId: this.state.call.id});
        });
    }

    async handleAcceptCall() {

        const speakerDevice = this.state.deviceManager.getSpeakerList()[0];
        if(!speakerDevice || speakerDevice.id === 'speaker:') {
            this.props.onShowSpeakerNotFoundWarning(true);
        } else if(speakerDevice) {
            this.state.deviceManager.setSpeaker(speakerDevice);
        }

        const microphoneDevice = this.state.deviceManager.getMicrophoneList()[0];
        if(!microphoneDevice || microphoneDevice.id === 'microphone:') {
            this.props.onShowMicrophoneNotFoundWarning(true);
        } else {
            this.state.deviceManager.setMicrophone(microphoneDevice);
        }

        this.state.call.accept({
            videoOptions: { localVideoStreams: undefined }
        }).catch((e) => console.error(e));
    }

    getIncomingActionContent() {
        return (
            <>
                <DefaultButton
                    className="answer-button my-3"
                    onClick={() => this.handleAcceptCall()}>
                    <i className="fas fa-phone"></i>Accept
                </DefaultButton>
            </>
        );
    }

    handleMicOnOff() {
        try {
            if(!this.mutePromise) {
                if (this.state.micOn) {
                    this.mutePromise = this.state.call.mute().then(() => {
                        this.setState({micOn: false});
                        this.mutePromise = undefined;
                    });
                } else {
                    this.mutePromise = this.state.call.unmute().then(() => {
                        this.setState({micOn: true});
                        this.mutePromise = undefined;
                    });
                }
            }
        } catch(e) {
            this.mutePromise = undefined;
            console.error(e);
        }
    }

    render() {
        return (
            <div className="ms-Grid mt-2">
                <div className="ms-Grid-row">
                    <div className="ms-Grid-col ms-lg6">
                        <h2>{this.state.callState !== 'Connected' ? `${this.state.callState}...` : `Connected`}</h2>
                    </div>
                    <div className="ms-Grid-col ms-lg6 text-right">
                        {
                            this.state.call &&
                            <h2>Call Id: {this.state.callId}</h2>
                        }
                    </div>
                </div>
                <div className="ms-Grid-row">
                    <div className="ms-Grid-col ms-lg12">
                        <div className="my-4">
                            {
                                this.state.callState !== 'Connected' &&
                                <div className="custom-row">
                                    <div className="ringing-loader mb-4"></div>
                                </div>
                            }
                            <div className="text-center">
                                    <span className="in-call-button"
                                        title={`${this.state.micOn ? 'Mute' : 'Unmute'} your microphone`}
                                        variant="secondary"
                                        onClick={() => this.handleMicOnOff()}>
                                        {
                                            this.state.micOn &&
                                            <Icon iconName="Microphone"/>
                                        }
                                        {
                                            !this.state.micOn &&
                                            <Icon iconName="MicOff2"/>
                                        }
                                    </span>
                                    <span className="in-call-button"
                                        onClick={() => this.state.call.hangUp({forEveryone: false}).catch((e) => console.error(e))}>
                                        <Icon iconName="DeclineCall"/>
                                    </span>
                            </div>
                            <div className="text-center">
                            {
                                this.state.callState === 'Incoming' ? this.getIncomingActionContent() : undefined
                            }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}