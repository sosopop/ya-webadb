import { IconButton, mergeStyles, mergeStyleSets, Nav, Stack, StackItem } from '@fluentui/react';
import { initializeIcons } from '@uifabric/icons';
import { Adb } from '@yume-chan/adb';
import React, { useCallback, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Redirect, useLocation } from 'react-router-dom';
import { AdbEventLogger, CacheRoute, CacheSwitch, Connect, ErrorDialogProvider, Logger, LoggerContextProvider, ToggleLogger } from './components';
import './index.css';
import { DeviceInfo, FileManager, FrameBuffer, Install, Intro, Scrcpy, Shell, TcpIp } from './routes';

initializeIcons();

const classNames = mergeStyleSets({
    'title-container': {
        borderBottom: '1px solid rgb(243, 242, 241)',
    },
    title: {
        padding: '4px 0',
        fontSize: 20,
        textAlign: 'center',
    },
    'left-column': {
        width: 250,
        paddingRight: 8,
        borderRight: '1px solid rgb(243, 242, 241)',
        overflow: 'auto',
    },
    'right-column': {
        borderLeft: '1px solid rgb(243, 242, 241)',
    }
});

interface RouteInfo {
    path: string;

    exact?: boolean;

    name: string;

    children: JSX.Element | null;

    noCache?: boolean;
}

function App(): JSX.Element | null {
    const location = useLocation();

    const [logger] = useState(() => new AdbEventLogger());
    const [device, setDevice] = useState<Adb | undefined>();

    const [leftPanelVisible, setLeftPanelVisible] = useState(() => innerWidth > 650);
    const toggleLeftPanel = useCallback(() => {
        setLeftPanelVisible(value => !value);
    }, []);


    const routes = useMemo((): RouteInfo[] => [
        // {
        //     path: '/',
        //     exact: true,
        //     name: 'Introduction',
        //     children: (
        //         <Intro />
        //     )
        // },
        {
            path: '/device-info',
            name: '设备信息',
            children: (
                <DeviceInfo device={device} />
            )
        },
        // {
        //     path: '/adb-over-wifi',
        //     name: 'ADB over WiFi',
        //     children: (
        //         <TcpIp device={device} />
        //     )
        // },
        {
            path: '/shell',
            name: '命令终端',
            children: (
                <Shell device={device} />
            ),
        },
        {
            path: '/file-manager',
            name: '文件管理',
            children: (
                <FileManager device={device} />
            ),
        },
        {
            path: '/install',
            name: '安装APK',
            children: (
                <Install device={device} />
            ),
        },
        {
            path: '/framebuffer',
            name: '截屏',
            children: (
                <FrameBuffer device={device} />
            ),
        },
        {
            path: '/scrcpy',
            name: '远程控制',
            noCache: true,
            children: (
                <Scrcpy device={device} />
            ),
        },
        {
            path: '/#',
            name: '其他控制功能',
            noCache: true,
            children: (
                <div />
            ),
        },
        {
            path: '/#',
            name: '设置',
            noCache: true,
            children: (
                <div />
            ),
        },
    ], [device]);

    return (
        <LoggerContextProvider>
            <Stack verticalFill>
                <Stack className={classNames['title-container']} horizontal verticalAlign="center">
                    <IconButton
                        checked={leftPanelVisible}
                        title="Toggle Menu"
                        iconProps={{ iconName: 'GlobalNavButton' }}
                        onClick={toggleLeftPanel}
                    />

                    <StackItem grow>
                        <div className={classNames.title}>屏端远程调试工具</div>
                    </StackItem>

                    <ToggleLogger />
                </Stack>

                <Stack grow horizontal verticalFill disableShrink styles={{ root: { minHeight: 0, overflow: 'hidden', lineHeight: '1.5' } }}>
                    <StackItem className={mergeStyles(classNames['left-column'], !leftPanelVisible && { display: 'none' })}>
                        <Connect
                            device={device}
                            logger={logger.logger}
                            onDeviceChange={setDevice}
                        />

                        <Nav
                            styles={{ root: {} }}
                            groups={[{
                                links: routes.map(route => ({
                                    key: route.path,
                                    name: route.name,
                                    url: `#${route.path}`,
                                })),
                            }]}
                            selectedKey={location.pathname}
                        />
                    </StackItem>

                    <StackItem grow styles={{ root: { width: 0 } }}>
                        <CacheSwitch>
                            {routes.map<React.ReactElement>(route => (
                                <CacheRoute
                                    exact={route.exact}
                                    path={route.path}
                                    noCache={route.noCache}>
                                    {route.children}
                                </CacheRoute>
                            ))}

                            <Redirect to="/" />
                        </CacheSwitch>
                    </StackItem>

                    <Logger className={classNames['right-column']} logger={logger} />
                </Stack>
            </Stack>
        </LoggerContextProvider>
    );
}

ReactDOM.render(
    <HashRouter>
        <ErrorDialogProvider>
            <App />
        </ErrorDialogProvider>
    </HashRouter>,
    document.getElementById('container')
);
