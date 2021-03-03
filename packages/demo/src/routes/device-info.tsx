import { Icon, MessageBar, Separator, Stack, StackItem, mergeStyleSets, Text } from '@fluentui/react';
import { Depths, FontSizes, NeutralColors, CommunicationColors, DefaultPalette } from '@fluentui/theme';
import { AdbFeatures } from '@yume-chan/adb';
import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { ExternalLink } from '../components';
import { withDisplayName } from '../utils';
import { RouteProps } from './type';
import ReactECharts from 'echarts-for-react';

import { RegisterShape, Shape } from 'bizcharts/lib/interface';

const classNames = mergeStyleSets({
    'title': {
        fontWeight: 'bold',
        color: NeutralColors.gray120,
    },
    'panel': {
        boxShadow: Depths.depth4,
        backgroundColor: NeutralColors.white,
        padding: 10,
    }
});

let computeShow = (v: any) => {
    if (v > 1024 * 1024 * 1024 * 1024) {
        return (v / 1024 / 1024 / 1024 / 1024).toFixed(1) + " TB";
    } if (v > 1024 * 1024 * 1024) {
        return (v / 1024 / 1024 / 1024).toFixed(1) + " GB";
    } if (v > 1024 * 1024) {
        return (v / 1024 / 1024).toFixed(1) + " MB";
    } else if (v > 1024) {
        return (v / 1024).toFixed(1) + " KB";
    }
    return Math.round(v) + " B";
}

let computeShowFromK = (v: any) => {
    if (v > 1024 * 1024 * 1024) {
        return (v / 1024 / 1024 / 1024).toFixed(1) + " TB";
    } if (v > 1024 * 1024) {
        return (v / 1024 / 1024).toFixed(1) + " GB";
    } if (v > 1024) {
        return (v / 1024).toFixed(1) + " MB";
    }
    return Math.round(v) + " KB";
}

const propsMap: any = {
    "ro.product.model": "设备型号",
    "ro.product.device": "设备名称",
    "ro.product.brand": "设备品牌",
    "ro.product.manufacturer": "设备厂商",
    "ro.build.version.release": "系统版本",
    "ro.build.date": "固件生成日期",
    "ro.build.description": "固件指纹",
};

const optionsCPU = {
    series: [{
        type: 'gauge',
        progress: {
            show: true,
            width: 5
        },
        axisLine: {
            lineStyle: {
                width: 4
            }
        },
        axisTick: {
            distance: 2,
            length: 3,
        },
        splitLine: {
            distance: 2,
            length: 5,
            lineStyle: {
                width: 2,
                color: '#999'
            }
        },
        axisLabel: {
            distance: 8,
            color: '#999',
            fontSize: 9
        },
        detail: {
            valueAnimation: true,
            fontSize: 16,
            formatter: '{value} %',
            offsetCenter: [0, '75%']
        },
        title: {
            offsetCenter: [0, '110%'],
            fontSize: 16
        },
        data: [{
            name: 'CPU',
            value: 0
        }]
    }]
};

const optionsMEM = {
    series: [{
        type: 'gauge',
        progress: {
            show: true,
            width: 5
        },
        axisLine: {
            lineStyle: {
                width: 4
            }
        },
        axisTick: {
            distance: 2,
            length: 3,
        },
        splitLine: {
            distance: 2,
            length: 5,
            lineStyle: {
                width: 2,
                color: '#999'
            }
        },
        axisLabel: {
            distance: 8,
            color: '#999',
            fontSize: 9
        },
        detail: {
            valueAnimation: true,
            fontSize: 16,
            formatter: '{value} %',
            offsetCenter: [0, '75%']
        },
        title: {
            offsetCenter: [0, '110%'],
            fontSize: 16
        },
        data: [{
            name: '内存',
            itemStyle: {

            },
            value: 0
        }]
    }]
};

const optionsDisk = {
    series: [{
        type: 'gauge',
        min: 0,
        max: 100,
        progress: {
            show: true,
            width: 5
        },
        axisLine: {
            lineStyle: {
                width: 4
            }
        },
        axisTick: {
            distance: 2,
            length: 3,
        },
        splitLine: {
            distance: 2,
            length: 5,
            lineStyle: {
                width: 2,
                color: '#999'
            }
        },
        axisLabel: {
            distance: 8,
            color: '#999',
            fontSize: 9
        },
        detail: {
            valueAnimation: true,
            fontSize: 16,
            formatter: '{value} %',
            offsetCenter: [0, '75%']
        },
        title: {
            offsetCenter: [0, '110%'],
            fontSize: 16
        },
        data: [{
            name: '磁盘',
            itemStyle: {
            },
            value: 0
        }]
    }]
};

const optionsSpeedIn = {
    series: [{
        type: 'gauge',
        min: 0,
        max: 2 * 1024 * 1024,
        itemStyle: {
            color: '#91cc75'
        },
        progress: {
            show: true,
            roundCap: true,
            width: 10
        },
        axisLine: {
            roundCap: true,
            lineStyle: {
                width: 10
            }
        },
        axisTick: {
            show: false,
        },
        splitLine: {
            show: false,
        },
        axisLabel: {
            show: false,
        },
        detail: {
            valueAnimation: true,
            fontSize: 16,
            formatter: (v: any) => {
                if (v > 1024 * 1024) {
                    return (v / 1024 / 1024).toFixed(1) + " MB/s";
                } else if (v > 1024) {
                    return (v / 1024).toFixed(1) + " KB/s";
                }
                return Math.round(v) + " B/s";
            },
            offsetCenter: [0, '75%']
        },
        title: {
            offsetCenter: [0, '110%'],
            fontSize: 16
        },
        data: [{
            name: '下行网速',
            value: 0
        }]
    }]
};

const optionsSpeedOut = {
    series: [{
        type: 'gauge',
        min: 0,
        max: 2 * 1024 * 1024,
        itemStyle: {
            color: '#91cc75'
        },
        progress: {
            show: true,
            roundCap: true,
            width: 10
        },
        axisLine: {
            roundCap: true,
            lineStyle: {
                width: 10
            }
        },
        axisTick: {
            show: false,
        },
        splitLine: {
            show: false,
        },
        axisLabel: {
            show: false,
        },
        detail: {
            valueAnimation: true,
            fontSize: 16,
            formatter: (v: any) => {
                if (v > 1024 * 1024) {
                    return (v / 1024 / 1024).toFixed(1) + " MB/s";
                } else if (v > 1024) {
                    return (v / 1024).toFixed(1) + " KB/s";
                }
                return Math.round(v) + " B/s";
            },
            offsetCenter: [0, '75%']
        },
        title: {
            offsetCenter: [0, '110%'],
            fontSize: 16
        },
        data: [{
            name: '上行网速',
            value: 0
        }]
    }]
};


const optionsTemp = {
    series: [{
        type: 'gauge',
        itemStyle: {
            color: '#FFAB91'
        },
        progress: {
            show: true,
            width: 5
        },
        axisLine: {
            lineStyle: {
                width: 4
            }
        },
        axisTick: {
            distance: 2,
            length: 3,
        },
        splitLine: {
            distance: 2,
            length: 5,
            lineStyle: {
                width: 2,
                color: '#999'
            }
        },
        axisLabel: {
            distance: 8,
            color: '#999',
            fontSize: 9
        },
        detail: {
            valueAnimation: true,
            fontSize: 16,
            formatter: '{value} °C',
            offsetCenter: [0, '75%']
        },
        title: {
            offsetCenter: [0, '110%'],
            fontSize: 16
        },
        data: [{
            name: 'CPU温度',
            value: 0
        }]
    }]
};

let chartRef: any = {};

export const DeviceInfo = withDisplayName('DeviceInfo')(({
    device
}: RouteProps): JSX.Element | null => {
    const [data, setData] = useState([{ value: 0.0 }]);
    const [sysInfo, setSysInfo] = useState([{ key: "", name: "", value: "" } as any]);
    const [appInfo, setAppInfo] = useState([{ key: "", name: "", ver: "", time: "" } as any]);

    useEffect(() => {
        //setData({ value: data.value + 1 });
        let result: Array<{
            key: string;
            name: string;
            value: string | undefined;
        }> = [];


        (async () => {
            if (!device)
                return;

            // "设备ID",
            // "设备序列号",
            // "开机时长",
            // "屏幕数量",
            // "摄像头数量",
            // "ip",
            // "当前系统流量",

            result.push({
                key: 'id',
                name: '设备ID',
                value: device.backend.name?.split('_')[1]
            })

            try {
                let output = await device?.getProp("");
                output.replace(/[\[\]]/ig, "").split("\n").forEach((v) => {
                    if (v) {
                        let value = v.match(/(.*?):(.*)/)?.map(v => v.trim());
                        if (value && value.length === 3 && propsMap[value[1]]) {
                            result.push({ "key": value[1], "name": propsMap[value[1]], "value": value[2] });
                        }
                    }
                })
                result = result.reverse();
            } catch (error) { }

            try {
                let ret = await device.exec('cat /proc/cpuinfo|grep Serial');
                let parsed = ret.trim().split(/\s+/);
                let serial = parsed[parsed.length - 1];
                result.push({
                    key: 'serial',
                    name: '设备主板编号',
                    value: serial
                })
            } catch (error) { }

            try {
                let ret = await device.exec('cat /proc/uptime');
                let parsed = ret.trim().split(/\s+/);
                let boot = parsed[0];
                result.push({
                    key: 'boottime',
                    name: '开机时长',
                    value: function () {
                        let sec_num = parseInt(boot, 10); // don't forget the second param
                        let hours: string | number = Math.floor(sec_num / 3600);
                        let minutes: string | number = Math.floor((sec_num - (hours * 3600)) / 60);
                        let seconds: string | number = sec_num - (hours * 3600) - (minutes * 60);

                        if (hours < 10) { hours = "0" + hours; }
                        if (minutes < 10) { minutes = "0" + minutes; }
                        if (seconds < 10) { seconds = "0" + seconds; }
                        return hours + ':' + minutes + ':' + seconds;
                    }()
                })
            } catch (error) { }

            try {
                let ret = await device.exec("dumpsys media.camera|grep 'Number of camera devices'");
                let parsed = ret.match(/(\d+)/);
                let num = "0";
                if (parsed) {
                    num = parsed[1];
                }
                result.push({
                    key: 'cameranum',
                    name: '摄像头数量',
                    value: num
                })
            } catch (error) { }

            try {
                let ret = await device.exec("dumpsys media.camera|grep 'is open'|busybox wc -l");
                let num = "0";
                if (ret) {
                    num = ret;
                }
                result.push({
                    key: 'cameraopened',
                    name: '摄像头已打开',
                    value: num
                })
            } catch (error) { }

            try {
                let ret = await device.exec("dumpsys display|grep 'Display Devices'");
                let parsed = ret.match(/(\d+)/);
                let num = "0";
                if (parsed) {
                    num = parsed[1];
                }
                result.push({
                    key: 'displaysize',
                    name: '屏幕数量',
                    value: num
                })
            } catch (error) { }

            try {
                let ret = await device.exec("cat /proc/net/dev|grep wlan0");
                let parsedNet = ret.split(/\s+/);
                if (parsedNet?.length > 10) {
                    let inSpeed = parseFloat(parsedNet[2]);
                    let outSpeed = parseFloat(parsedNet[10]);
                    result.push({
                        key: 'nettraffic',
                        name: 'WIFI流量总计',
                        value: '接收 ' + computeShow(inSpeed) + "，发送 " + computeShow(outSpeed),
                    })
                }
            } catch (error) { }


            try {
                let ret = await device.exec("df -h /data 2>/dev/null|grep '/data'");
                let parsedDisk = ret.split(/\s+/g);
                if (parsedDisk?.length > 3) {
                    if (chartRef.refDisk) {
                        let total = parsedDisk[1];
                        let used = parsedDisk[2];
                        result.push({
                            key: 'diskused',
                            name: '磁盘使用',
                            value: used + ' / ' + total,
                        })
                    }
                }
            } catch (error) { }

            try {
                let ret = await device.exec("dumpsys meminfo|grep RAM");
                let parsedMEM = ret.replace(/,/g, "").match(/Total RAM\:\s*?(\d+)\s*?k[\s\S]*?Used RAM\:\s*?(\d+)\s*?k[\s\S]*?Lost RAM\:\s*?(-?\d+)\s*?k/i);
                if (parsedMEM?.length === 4) {
                    let total = parseFloat(parsedMEM[1]);
                    let used = parseFloat(parsedMEM[2]);
                    let lost = parseFloat(parsedMEM[3]);
                    result.push({
                        key: 'memused',
                        name: '内存使用',
                        value: computeShowFromK(used) + ' / ' + computeShowFromK(total),
                    })
                }
            } catch (error) { }

            setSysInfo([...result]);

            try {
                let appResult: any = [];
                let ret = await device.exec("pm list package|grep -o -E 'com\.cnnho.*'|busybox xargs -n1 dumpsys package|grep -E 'Package\\ \\[|lastUpdateTime|versionName'");
                console.log(ret);
                let packageList = ret.split("Package [");
                for (let pkgInfo of packageList) {
                    pkgInfo = pkgInfo.trim();
                    let pkgInfoItems = pkgInfo.match(/(.*?)\][\s\S]*?versionName=([\d\.]*)[\s\S]*?lastUpdateTime=(.*)/);
                    if (pkgInfoItems?.length === 4) {
                        appResult.push({
                            name: pkgInfoItems[1],
                            ver: pkgInfoItems[2],
                            time: pkgInfoItems[3],
                        })
                    }
                }
                setAppInfo(appResult);
            } catch (error) { }
        })();

        let topSocket: any;
        device?.createSocket("shell:busybox top -d1|grep CPU:").then(socket => {
            let topString = "";
            topSocket = socket;
            socket.onData(buffer => {
                topString += device.backend.decodeUtf8(buffer);
                let parsedCpu = topString.match(/CPU\:\s?([\d\.]+)%/);
                if (parsedCpu?.length === 2) {
                    if (chartRef.refCPU) {
                        const echartInstance = chartRef.refCPU.getEchartsInstance();
                        optionsCPU.series[0].data[0].value = parseInt(parsedCpu[1]);
                        echartInstance.setOption(optionsCPU);
                    }
                    topString = "";
                }
                if (topString.length > 1000) {
                    topString = "";
                }
            });
            socket.onClose(() => { topSocket = null; console.log("busybox top closed") });
        }).catch((e) => { });

        //let memTimer = setInterval(() => {
        device?.exec("dumpsys meminfo|grep RAM").then((result) => {
            let parsedMEM = result.replace(/,/g, "").match(/Total RAM\:\s*?(\d+)\s*?k[\s\S]*?Used RAM\:\s*?(\d+)\s*?k[\s\S]*?Lost RAM\:\s*?(-?\d+)\s*?k/i);
            if (parsedMEM?.length === 4) {
                if (chartRef.refMem) {
                    const echartInstance = chartRef.refMem.getEchartsInstance();
                    let total = parseFloat(parsedMEM[1]);
                    let used = parseFloat(parsedMEM[2]);
                    let lost = parseFloat(parsedMEM[3]);
                    optionsMEM.series[0].data[0].value = Math.round((used + lost) / total * 100);
                    echartInstance.setOption(optionsMEM);
                }
            }
        }).catch((e) => { });
        //}, 2000);

        device?.exec("df -h /data 2>/dev/null|grep '/data'").then((result) => {
            function getSpace(space: string) {
                let parsedRet = space.match(/([\d\.]+)\s*?([KMGT])/);
                if (parsedRet?.length == 3) {
                    switch (parsedRet[2]) {
                        case 'T':
                            return parseInt(parsedRet[1]) * 1024 * 1024 * 1024;
                        case 'G':
                            return parseInt(parsedRet[1]) * 1024 * 1024;
                        case 'M':
                            return parseInt(parsedRet[1]) * 1024 * 1024;
                        case 'K':
                            return parseInt(parsedRet[1]) * 1024;
                    }
                } else if (parsedRet?.length == 2) {
                    return parseInt(parsedRet[1]);
                }
                return 0;
            }
            let parsedDisk = result.split(/\s+/g);
            if (parsedDisk?.length > 3) {
                if (chartRef.refDisk) {
                    let total = getSpace(parsedDisk[1]);
                    let used = getSpace(parsedDisk[2]);
                    const echartInstance = chartRef.refDisk.getEchartsInstance();
                    optionsDisk.series[0].data[0].value = Math.round(used / total * 100);
                    optionsDisk
                    echartInstance.setOption(optionsDisk);
                }
            }
        }).catch((e) => { });

        let inSpeedLast = 0;
        let outSpeedLast = 0;

        let netTimer = setInterval(() => {
            device?.exec("cat /proc/net/dev|grep wlan0").then((result) => {
                let parsedNet = result.split(/\s+/);
                if (parsedNet?.length > 10) {
                    if (chartRef.refSpeedIn && chartRef.refSpeedOut) {
                        const echartInInstance = chartRef.refSpeedIn.getEchartsInstance();
                        const echartOutInstance = chartRef.refSpeedOut.getEchartsInstance();
                        let inSpeedNew = parseFloat(parsedNet[2]);
                        let outSpeedNew = parseFloat(parsedNet[10]);
                        let inSpeed = inSpeedNew - inSpeedLast;
                        let outSpeed = outSpeedNew - outSpeedLast;
                        if (inSpeedLast === 0) {
                            inSpeed = 0;
                            outSpeed = 0;
                        }
                        inSpeedLast = inSpeedNew;
                        outSpeedLast = outSpeedNew;
                        optionsSpeedIn.series[0].data[0].value = (inSpeed / 2);
                        optionsSpeedOut.series[0].data[0].value = (outSpeed / 2);
                        echartInInstance.setOption(optionsSpeedIn);
                        echartOutInstance.setOption(optionsSpeedOut);
                    }
                }
            }).catch((e) => { });
        }, 2000);

        let tempTimer = setInterval(() => {
            device?.exec("cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null;cat /sys/bus/platform/drivers/tsadc/ff280000.tsadc/temp1_input 2>/dev/null;cat /sys/devices/ff280000.tsadc/temp1_input 2>/dev/null").then((result) => {
                if (result) {
                    let i = parseInt(result);
                    if (i > 200) {
                        i = Math.round(i / 1024);
                    }
                    const echartInstance = chartRef.refTemp.getEchartsInstance();
                    optionsTemp.series[0].data[0].value = i;
                    echartInstance.setOption(optionsTemp);
                }
            }).catch((e) => { });
        }, 2000);
        return () => {
            if (topSocket) {
                topSocket
            }
            clearInterval(netTimer);
            clearInterval(tempTimer);
            //clearInterval(memTimer);
        }
    }, [device]);

    return (
        <>
            <Stack tokens={{
                childrenGap: 10,
            }}>
                <Text variant={'medium'} className={classNames.title}>系统状态</Text>
                <StackItem className={classNames.panel}>
                    <Stack horizontal wrap tokens={{}}>
                        <ReactECharts option={optionsCPU} style={{ width: 240, height: 240 }} ref={(e) => {
                            chartRef.refCPU = e;
                        }} />
                        <ReactECharts option={optionsMEM} style={{ width: 240, height: 240 }} ref={(e) => {
                            chartRef.refMem = e;
                        }} />
                        <ReactECharts option={optionsDisk} style={{ width: 240, height: 240 }} ref={(e) => {
                            chartRef.refDisk = e;
                        }} />
                        <ReactECharts option={optionsSpeedIn} style={{ width: 240, height: 240 }} ref={(e) => {
                            chartRef.refSpeedIn = e;
                        }} />
                        <ReactECharts option={optionsSpeedOut} style={{ width: 240, height: 240 }} ref={(e) => {
                            chartRef.refSpeedOut = e;
                        }} />
                        <ReactECharts option={optionsTemp} style={{ width: 240, height: 240 }} ref={(e) => {
                            chartRef.refTemp = e;
                        }} />
                    </Stack>
                </StackItem>
                <Text variant={'medium'} className={classNames.title}>系统信息</Text>
                <StackItem>
                    <Stack tokens={{
                        childrenGap: 10,
                    }} horizontal>
                        <StackItem grow className={classNames.panel}>
                            <table>
                                <colgroup>
                                    <col span={1} style={{ width: 120 }}></col>
                                    <col span={1}></col>
                                </colgroup>
                                <tbody>
                                    {
                                        sysInfo.map((v) => (
                                            <tr key={v.key}>
                                                <td><b>{v.name}</b></td><td>{v.value}</td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </StackItem>
                        <StackItem grow className={classNames.panel}>
                        </StackItem>
                    </Stack>
                </StackItem>
                <Text variant={'medium'} className={classNames.title}>应用信息</Text>
                <StackItem>
                    <Stack tokens={{
                        childrenGap: 10,
                    }} horizontal>
                        <StackItem grow className={classNames.panel}>
                            <table>
                                <colgroup>
                                    <col span={1} style={{ width: 300 }}></col>
                                    <col span={1} style={{ width: 120 }}></col>
                                    <col span={1}></col>
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left' }}>包名</th>
                                        <th>版本号</th>
                                        <th>更新时间</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        appInfo.map((v) => (
                                            <tr key={v.key}>
                                                <td><b>{v.name}</b></td><td style={{ textAlign: 'center' }}>{v.ver}</td><td>{v.time}</td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </StackItem>
                        <StackItem grow className={classNames.panel}>
                        </StackItem>
                    </Stack>
                </StackItem>
            </Stack>

            {/*                 
            <span>设备型号: {device?.model}</span>
            <span>设备名: {device?.device}</span>
            <Separator /> */}
        </>
    );
});
