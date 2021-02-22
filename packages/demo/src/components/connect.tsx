import { DefaultButton, Dialog, Dropdown, IDropdownOption, PrimaryButton, ProgressIndicator, Stack, StackItem, TooltipHost } from '@fluentui/react';
import { Adb, AdbBackend, AdbLogger } from '@yume-chan/adb';
import AdbWebUsbBackend, { AdbWebUsbBackendWatcher } from '@yume-chan/adb-backend-webusb';
import AdbWsBackend from '@yume-chan/adb-backend-ws';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CommonStackTokens } from '../styles';
import { withDisplayName } from '../utils';
import { ErrorDialogContext } from './error-dialog';

const DropdownStyles = { dropdown: { width: '100%', marginTop: 10 } };

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

    const [selectedBackend, setSelectedBackend] = useState<AdbBackend | undefined>();
    const [connecting, setConnecting] = useState(false);

    const [usbBackendList, setUsbBackendList] = useState<AdbBackend[]>([]);
    const updateUsbBackendList = useCallback(async () => {
        const backendList: AdbBackend[] = await AdbWebUsbBackend.getDevices();
        setUsbBackendList(backendList);
        return backendList;
    }, []);
    useEffect(() => {
        if (!supported) {
            showErrorDialog('Your browser does not support WebUSB standard, which is required for this site to work.\n\nLatest version of Google Chrome (for Windows, macOS, Linux and Android), Microsoft Edge (for Windows and macOS), or other Chromium-based browsers should work.');
            return;
        }

        updateUsbBackendList();

        const watcher = new AdbWebUsbBackendWatcher(async (serial?: string) => {
            const list = await updateUsbBackendList();

            if (serial) {
                setSelectedBackend(list.find(backend => backend.serial === serial));
                return;
            }
        });
        return () => watcher.dispose();
    }, []);

    const [wsBackendList, setWsBackendList] = useState<AdbBackend[]>([]);
    useEffect(() => {
        const intervalId = setTimeout(async () => {
            if (connecting || device) {
                return;
            }
            let backendList:AdbBackend[] = [];
            backendList.push(new AdbWsBackend("ws://127.0.0.1:1555/?user=aliyun_68691&pass=839725", "aliyun_68691"));
            backendList.push(new AdbWsBackend("ws://127.0.0.1:1555/?user=aliyun_68693&pass=126413", "aliyun_68693"));
            backendList.push(new AdbWsBackend("ws://127.0.0.1:1555/?user=aliyun_68694&pass=830864", "aliyun_68694"));
            backendList.push(new AdbWsBackend("ws://127.0.0.1:1555/?user=aliyun_68695&pass=367909", "aliyun_68695"));
            backendList.push(new AdbWsBackend("ws://127.0.0.1:1555/?user=7171&pass=2492", "7171"));
            setWsBackendList(backendList)
            setSelectedBackend(backendList[0])
            // try {
            //     //await wsBackend.connect();
            //     //setWsBackendList([wsBackend]);
            //     //setSelectedBackend(wsBackend);
            // } catch {
            //     setWsBackendList([]);
            // } finally {
            //     await wsBackend.dispose();
            // }
        }, 0);

        // return () => {
        //     clearInterval(intervalId);
        // };
    }, [connecting, device]);

    const handleSelectedBackendChange = (
        _e: React.FormEvent<HTMLDivElement>,
        option?: IDropdownOption,
    ) => {
        setSelectedBackend(option?.data as AdbBackend);
    };

    const requestAccess = useCallback(async () => {
        const backend = await AdbWebUsbBackend.requestDevice();
        setSelectedBackend(backend);
        await updateUsbBackendList();
    }, []);

    const connect = useCallback(async () => {
        try {
            if (selectedBackend) {
                const device = new Adb(selectedBackend, logger);
                try {
                    setConnecting(true);
                    await device.connect();
                    try {
                        await device.remount();
                    } catch (error) {

                    }
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

    const backendList = useMemo(
        () => ([] as AdbBackend[]).concat(usbBackendList, wsBackendList),
        [usbBackendList, wsBackendList]
    );

    const backendOptions = useMemo(() => {
        return backendList.map(backend => ({
            key: backend.serial,
            text: backend.name || backend.serial,
            data: backend,
        }));
    }, [backendList]);

    useEffect(() => {
        setSelectedBackend(old => {
            if (old) {
                const current = backendList.find(backend => backend.serial === old.serial);
                if (current) {
                    return current;
                }
            }

            return backendList.length ? backendList[0] : undefined;
        });
    }, [backendList]);

    return (
        <Stack
            tokens={{ childrenGap: 8, padding: '0 0 8px 8px' }}
            styles={{ root: {paddingTop: 10}}}
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
                    title: '连接中...',
                    subText: '正在连接中，请稍后。'
                }}
            >
                <ProgressIndicator />
            </Dialog>
        </Stack>
    );
});
