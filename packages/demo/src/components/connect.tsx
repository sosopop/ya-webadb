import { DefaultButton, Dialog, Dropdown, IDropdownOption, PrimaryButton, ProgressIndicator, Stack, StackItem, TooltipHost } from '@fluentui/react';
import { Adb, AdbBackend, AdbLogger } from '@yume-chan/adb';
import AdbWebUsbBackend, { AdbWebUsbBackendWatcher } from '@yume-chan/adb-backend-webusb';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ErrorDialogContext } from './error-dialog';
import { CommonStackTokens } from '../styles';
import { withDisplayName } from '../utils';
import AdbWsBackend from '@yume-chan/adb-backend-ws';

const DropdownStyles = { dropdown: { width: '100%' } };

interface ConnectProps {
    device: Adb | undefined;

    logger?: AdbLogger;

    onDeviceChange: (device: Adb | undefined) => void;
}

//const wsBackend = new AdbWsBackend("ws://127.0.0.1:1555/?user=aliyun_68694&pass=294849");

export const Connect = withDisplayName('Connect')(({
    device,
    logger,
    onDeviceChange,
}: ConnectProps): JSX.Element | null => {
    const supported = AdbWebUsbBackend.isSupported();

    const { show: showErrorDialog } = useContext(ErrorDialogContext);

    const [backendOptions, setBackendOptions] = useState<IDropdownOption[]>([]);
    const [selectedBackend, setSelectedBackend] = useState<AdbBackend | undefined>();
    useEffect(() => {
        if (!supported) {
            showErrorDialog('Your browser does not support WebUSB standard, which is required for this site to work.\n\nLatest version of Google Chrome (for Windows, macOS, Linux and Android), Microsoft Edge (for Windows and macOS), or other Chromium-based browsers should work.');
            return;
        }

        async function refresh() {
            const backendList: AdbBackend[] = await AdbWebUsbBackend.getDevices();
            backendList.push(new AdbWsBackend("ws://127.0.0.1:1555/?user=aliyun_68691&pass=210930", "aliyun_68691"));
            backendList.push(new AdbWsBackend("ws://127.0.0.1:1555/?user=aliyun_68694&pass=294849", "aliyun_68694"));
            backendList.push(new AdbWsBackend("ws://127.0.0.1:1555/?user=aliyun_68695&pass=806321", "aliyun_68695"));

            const options: IDropdownOption[] = backendList.map(item => ({
                key: item.serial,
                text: `${item.name}`,
                data: item,
            }));
            setBackendOptions(options);

            setSelectedBackend(old => {
                if (old && backendList.some(item => item.serial === old.serial)) {
                    return old;
                }
                return backendList[0];
            });
        };

        refresh();
        const watcher = new AdbWebUsbBackendWatcher(refresh);
        return () => watcher.dispose();
    }, []);

    const handleSelectedBackendChange = (
        _e: React.FormEvent<HTMLDivElement>,
        option?: IDropdownOption,
    ) => {
        setSelectedBackend(option?.data as AdbBackend);
    };

    const requestAccess = useCallback(async () => {
        const backend = await AdbWebUsbBackend.requestDevice();
        if (backend) {
            setBackendOptions(list => {
                for (const item of list) {
                    if (item.key === backend.serial) {
                        setSelectedBackend(item.data);
                        return list;
                    }
                }

                setSelectedBackend(backend);
                return [...list, {
                    key: backend.serial,
                    text: `${backend.serial} ${backend.name ? `(${backend.name})` : ''}`,
                    data: backend,
                }];
            });
        }
    }, []);

    const [connecting, setConnecting] = useState(false);
    const connect = useCallback(async () => {
        try {
            if (selectedBackend) {
                const device = new Adb(selectedBackend, logger);
                try {
                    setConnecting(true);
                    await device.connect();
                    onDeviceChange(device);
                } catch (e) {
                    device.dispose();
                    throw e;
                }
            }
        } catch (e) {
            showErrorDialog(e.message);
        } finally {
            setConnecting(false);
        }
    }, [selectedBackend, logger, onDeviceChange]);
    const disconnect = useCallback(async () => {
        try {
            await device!.dispose();
            onDeviceChange(undefined);
        } catch (e) {
            showErrorDialog(e.message);
        }
    }, [device]);
    useEffect(() => {
        return device?.onDisconnected(() => {
            onDeviceChange(undefined);
        });
    }, [device, onDeviceChange]);

    return (
        <Stack
            tokens={{ childrenGap: 8, padding: '0 0 8px 8px' }}
        >
            <Dropdown
                disabled={!!device || backendOptions.length === 0}
                label="可用设备"
                placeholder="No available devices"
                options={backendOptions}
                styles={DropdownStyles}
                dropdownWidth={300}
                selectedKey={selectedBackend?.serial}
                onChange={handleSelectedBackendChange}
            />

            {!device ? (
                <Stack horizontal tokens={CommonStackTokens}>
                    <StackItem grow shrink>
                        <PrimaryButton
                            text="连接"
                            disabled={!selectedBackend}
                            primary={!!selectedBackend}
                            styles={{ root: { width: '100%' } }}
                            onClick={connect}
                        />
                    </StackItem>
                    {/* <StackItem grow shrink>
                        <TooltipHost
                            content="WebADB can't connect to anything without your explicit permission."
                        >
                            <DefaultButton
                                text="Add device"
                                disabled={!supported}
                                primary={!selectedBackend}
                                styles={{ root: { width: '100%' } }}
                                onClick={requestAccess}
                            />
                        </TooltipHost>
                    </StackItem> */}
                </Stack>
            ) : (
                    <DefaultButton text="断开连接" onClick={disconnect} />
                )}

            <Dialog
                hidden={!connecting}
                dialogContentProps={{
                    title: 'Connecting...',
                    subText: 'Please authorize the connection on your device'
                }}
            >
                <ProgressIndicator />
            </Dialog>
        </Stack>
    );
});
