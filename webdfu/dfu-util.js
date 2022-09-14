var device = null;
(function() {
    'use strict';

    function hex4(n) {
        let s = n.toString(16)
        while (s.length < 4) {
            s = '0' + s;
        }
        return s;
    }

    function hexAddr8(n) {
        let s = n.toString(16)
        while (s.length < 8) {
            s = '0' + s;
        }
        return "0x" + s;
    }


    function niceSize(n) {
        const gigabyte = 1024 * 1024 * 1024;
        const megabyte = 1024 * 1024;
        const kilobyte = 1024;
        if (n >= gigabyte) {
            return n / gigabyte + "GiB";
        } else if (n >= megabyte) {
            return n / megabyte + "MiB";
        } else if (n >= kilobyte) {
            return n / kilobyte + "KiB";
        } else {
            return n + "B";
        }
    }


    function formatDFUSummary(device) {
        const vid = hex4(device.device_.vendorId);
        const pid = hex4(device.device_.productId);
        const name = device.device_.productName;

        let mode = "Unknown"
        if (device.settings.alternate.interfaceProtocol == 0x01) {
            mode = "Runtime";
        } else if (device.settings.alternate.interfaceProtocol == 0x02) {
            mode = "DFU";
        }

        const cfg = device.settings.configuration.configurationValue;
        const intf = device.settings["interface"].interfaceNumber;
        const alt = device.settings.alternate.alternateSetting;
        const serial = device.device_.serialNumber;
        let info = `${mode}: [${vid}:${pid}] cfg=${cfg}, intf=${intf}, alt=${alt}, name="${name}" serial="${serial}"`;
        return info;
    }

    function formatDFUInterfaceAlternate(settings) {
        let mode = "Unknown"
        if (settings.alternate.interfaceProtocol == 0x01) {
            mode = "Runtime";
        } else if (settings.alternate.interfaceProtocol == 0x02) {
            mode = "DFU";
        }

        const cfg = settings.configuration.configurationValue;
        const intf = settings["interface"].interfaceNumber;
        const alt = settings.alternate.alternateSetting;
        const name = (settings.name) ? settings.name : "UNKNOWN";

        return `${mode}: cfg=${cfg}, intf=${intf}, alt=${alt}, name="${name}"`;
    }

    async function fixInterfaceNames(device_, interfaces) {
        // Check if any interface names were not read correctly
        if (interfaces.some(intf => (intf.name == null))) {
            // Manually retrieve the interface name string descriptors
            let tempDevice = new dfu.Device(device_, interfaces[0]);
            await tempDevice.device_.open();
	    await tempDevice.device_.selectConfiguration(1);
            let mapping = await tempDevice.readInterfaceNames();
            await tempDevice.close();

            for (let intf of interfaces) {
                if (intf.name === null) {
                    let configIndex = intf.configuration.configurationValue;
                    let intfNumber = intf["interface"].interfaceNumber;
                    let alt = intf.alternate.alternateSetting;
                    intf.name = mapping[configIndex][intfNumber][alt];
                }
            }
        }
    }

    function populateInterfaceList(form, device_, interfaces) {
        let old_choices = Array.from(form.getElementsByTagName("div"));
        for (let radio_div of old_choices) {
            form.removeChild(radio_div);
        }

        let button = form.getElementsByTagName("button")[0];

        for (let i=0; i < interfaces.length; i++) {
            let radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "interfaceIndex";
            radio.value = i;
            radio.id = "interface" + i;
            radio.required = true;

            let label = document.createElement("label");
            label.textContent = formatDFUInterfaceAlternate(interfaces[i]);
            label.className = "radio"
            label.setAttribute("for", "interface" + i);

            let div = document.createElement("div");
            div.appendChild(radio);
            div.appendChild(label);
            form.insertBefore(div, button);
        }
    }

    function getDFUDescriptorProperties(device) {
        // Attempt to read the DFU functional descriptor
        // TODO: read the selected configuration's descriptor
        return device.readConfigurationDescriptor(0).then(
            data => {
                let configDesc = dfu.parseConfigurationDescriptor(data);
                let funcDesc = null;
                let configValue = device.settings.configuration.configurationValue;
                if (configDesc.bConfigurationValue == configValue) {
                    for (let desc of configDesc.descriptors) {
                        if (desc.bDescriptorType == 0x21 && desc.hasOwnProperty("bcdDFUVersion")) {
                            funcDesc = desc;
                            break;
                        }
                    }
                }

                if (funcDesc) {
                    return {
                        WillDetach:            ((funcDesc.bmAttributes & 0x08) != 0),
                        ManifestationTolerant: ((funcDesc.bmAttributes & 0x04) != 0),
                        CanUpload:             ((funcDesc.bmAttributes & 0x02) != 0),
                        CanDnload:             ((funcDesc.bmAttributes & 0x01) != 0),
                        TransferSize:          funcDesc.wTransferSize,
                        DetachTimeOut:         funcDesc.wDetachTimeOut,
                        DFUVersion:            funcDesc.bcdDFUVersion
                    };
                } else {
                    return {};
                }
            },
            error => {}
        );
    }

    // Current log div element to append to
    let logContext = null;

    function setLogContext(div) {
        logContext = div;
    };

    function clearLog(context) {
        if (typeof context === 'undefined') {
            context = logContext;
        }
        if (context) {
            context.innerHTML = "";
        }
    }

    function logDebug(msg) {
        console.log(msg);
    }

    function logInfo(msg) {
        if (logContext) {
            let info = document.createElement("p");
            info.className = "info";
            info.textContent = msg;
            logContext.appendChild(info);
        }
    }

    function logWarning(msg) {
        if (logContext) {
            let warning = document.createElement("p");
            warning.className = "warning";
            warning.textContent = msg;
            logContext.appendChild(warning);
        }
    }

    function logError(msg) {
        if (logContext) {
            let error = document.createElement("p");
            error.className = "error";
            error.textContent = msg;
            logContext.appendChild(error);
        }
    }

    function logProgress(done, total) {
        if (logContext) {
            let progressBar;
            if (logContext.lastChild.tagName.toLowerCase() == "progress") {
                progressBar = logContext.lastChild;
            }
            if (!progressBar) {
                progressBar = document.createElement("progress");
                logContext.appendChild(progressBar);
            }
            progressBar.value = done;
            if (typeof total !== 'undefined') {
                progressBar.max = total;
            }
        }
    }

    document.addEventListener('DOMContentLoaded', event => {
        let connectButton = document.querySelector("#connect");
        let uploadButton = document.querySelector("#upload");
        let statusDisplay = document.querySelector("#status");

        let searchParams = new URLSearchParams(window.location.search);
        let fromLandingPage = false;

        // Hardcode vendor ID to ST
        let vid = 0;

        let vidString = "0x0483"
        try {
            if (vidString.toLowerCase().startsWith("0x")) {
                vid = parseInt(vidString, 16);
            } else {
                vid = parseInt(vidString, 10);
            }
            //vidField.value = "0x" + hex4(vid).toUpperCase();
            fromLandingPage = true;
        } catch (error) {
            console.log("Bad VID " + vidString + ":" + error);
        }

        // Grab the serial number from the landing page
        let serial = "";
        if (searchParams.has("serial")) {
            serial = searchParams.get("serial");
            // Workaround for Chromium issue 339054
            if (window.location.search.endsWith("/") && serial.endsWith("/")) {
                serial = serial.substring(0, serial.length-1);
            }
            fromLandingPage = true;
        }

        let transferSize = 1024; // EMZ changed for STM32G4// 2048;
        let startAddress = 0x8000000;
        let maxUploadSize = 0; // overwritten by device.memoryInfo which reads flash size

        let firmwareFile = null;

        let downloadLog = document.querySelector("#downloadLog");
        let uploadLog = document.querySelector("#uploadLog");

        let manifestationTolerant = true;

        function onDisconnect(reason) {
            if (reason) {
                statusDisplay.textContent = reason;
            }
            connectButton.textContent = "Connect and Update";
        }

        function onUnexpectedDisconnect(event) {
            if (device !== null && device.device_ !== null) {
                if (device.device_ === event.device) {
                    device.disconnected = true;
                    onDisconnect("Device disconnected");
                    device = null;
                }
            }
        }

        async function connect(device) {
            try {
                await device.open();
            } catch (error) {
                onDisconnect(error);
                throw error;
            }

            // Attempt to parse the DFU functional descriptor
            let desc = {};
            try {
                desc = await getDFUDescriptorProperties(device);
            } catch (error) {
                onDisconnect(error);
                throw error;
            }

            let memorySummary = "";
            if (desc && Object.keys(desc).length > 0) {
                device.properties = desc;
                let info = `WillDetach=${desc.WillDetach}, ManifestationTolerant=${desc.ManifestationTolerant}, CanUpload=${desc.CanUpload}, CanDnload=${desc.CanDnload}, TransferSize=${desc.TransferSize}, DetachTimeOut=${desc.DetachTimeOut}, Version=${hex4(desc.DFUVersion)}`;
		        // EMZ disabled
                // emz hardcode start address
                device.startAddress = parseInt(startAddress, 16);

                if (desc.CanDnload) {
                    manifestationTolerant = desc.ManifestationTolerant;
                }

                if (device.settings.alternate.interfaceProtocol == 0x02) {
                    if (!desc.CanUpload) {
                        uploadButton.disabled = true;
                        dfuseUploadSizeField.disabled = true;
                    }
                    if (!desc.CanDnload) {
                        dnloadButton.disabled = true;
                    }
                }

                if (desc.DFUVersion == 0x011a && device.settings.alternate.interfaceProtocol == 0x02) {
                    device = new dfuse.Device(device.device_, device.settings);
                    if (device.memoryInfo) {
                        let totalSize = 0;
                        for (let segment of device.memoryInfo.segments) {
                            totalSize += segment.end - segment.start;
                        }
                        memorySummary = `Selected memory region: ${device.memoryInfo.name} (${niceSize(totalSize)})`;
                        for (let segment of device.memoryInfo.segments) {
                            let properties = [];
                            if (segment.readable) {
                                properties.push("readable");
                            }
                            if (segment.erasable) {
                                properties.push("erasable");
                            }
                            if (segment.writable) {
                                properties.push("writable");
                            }
                            let propertySummary = properties.join(", ");
                            if (!propertySummary) {
                                propertySummary = "inaccessible";
                            }

                            memorySummary += `\n${hexAddr8(segment.start)}-${hexAddr8(segment.end-1)} (${propertySummary})`;
                        }
                    }
                }
            }
            
            // Bind logging methods
            device.logDebug = logDebug;
            device.logInfo = logInfo;
            device.logWarning = logWarning;
            device.logError = logError;
            device.logProgress = logProgress;

            // Clear logs
            clearLog(uploadLog);
            clearLog(downloadLog);

            // Display basic USB information
            statusDisplay.textContent = '';
            connectButton.textContent = 'Disconnect';

            if (device.memoryInfo) {
                let segment = device.getFirstWritableSegment();
                if (segment) {
                    device.startAddress = segment.start;
                    const maxReadSize = device.getMaxReadSize(segment.start);
                    maxUploadSize = maxReadSize
                }
            }
            
            let firmwarePath = "/CANine.bin";

	    // Download binary file to memory
            var req = new XMLHttpRequest();
            req.open('GET', firmwarePath, true);
    	    req.responseType = "blob";
            
	    req.onload = async function(oEvent) {

                let reader = new FileReader();
                reader.onload = async function() {
                    firmwareFile = reader.result;
                    
                    if (device && firmwareFile != null) {
                        setLogContext(downloadLog);
                        clearLog(downloadLog);
                        try {
                            let status = await device.getStatus();
                            if (status.state == dfu.dfuERROR) {
                                await device.clearStatus();
                            }
                        } catch (error) {
                            device.logWarning("Failed to clear status");
                        }
                        await device.do_download(transferSize, firmwareFile, manifestationTolerant).then(
                            () => {
                                logInfo("Your device has been updated! Return the boot switch to its normal position and reconnect the device to start using the new firmware.");
                                setLogContext(null);
                                if (!manifestationTolerant) {
                                    device.waitDisconnected(5000).then(
                                        dev => {
                                            onDisconnect();
                                            device = null;
                                        },
                                        error => {
                                            // It didn't reset and disconnect for some reason...
                                            console.log("Device unexpectedly tolerated manifestation.");
                                        }
                                    );
                                }
                            },
                            error => {
                                logError(error);
                                setLogContext(null);
                            }
                        )
                    }
                };
                reader.readAsArrayBuffer(req.response);

            };
            req.send();
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            

            return device;
        }

        
        
        
        
        
        
        
        function autoConnect(vid, serial) {
            dfu.findAllDfuInterfaces().then(
                async dfu_devices => {
                    let matching_devices = [];
                    for (let dfu_device of dfu_devices) {
                        if (serial) {
                            if (dfu_device.device_.serialNumber == serial) {
                                matching_devices.push(dfu_device);
                            }
                        } else if (dfu_device.device_.vendorId == vid) {

                            console.log("Found matching VID device: " + vid + " s/n " + dfu_device.device_.serialNumber);
                            matching_devices.push(dfu_device);
                        }
                    }

                    if (matching_devices.length == 0) {
                        statusDisplay.textContent = 'Please plug in your device in boot mode'; // EMZ suppress this message 'No device found on auto.';
                    } else {
                        if (matching_devices.length == 1) {
                            statusDisplay.textContent = 'Connecting...';
                            device = matching_devices[0];
                            console.log(device);
                            device = await connect(device);
                        } else {
                            statusDisplay.textContent = "Device detected";
                        }
                        //vidField.value = "0x" + hex4(matching_devices[0].device_.vendorId).toUpperCase();
                        vid = matching_devices[0].device_.vendorId;
                    }
                }
            );
        }

        //vidField.addEventListener("change", function() {
        //    vid = parseInt(vidField.value, 16);
        //});

        //transferSizeField.addEventListener("change", function() {
        //    transferSize = parseInt(transferSizeField.value);
        //});

        //dfuseStartAddressField.addEventListener("change", function(event) {
        //    const field = event.target;
        //    let address = parseInt(field.value, 16);
        //    if (isNaN(address)) {
        //        field.setCustomValidity("Invalid hexadecimal start address");
        //    } else if (device && device.memoryInfo) {
        //        if (device.getSegment(address) !== null) {
        //            device.startAddress = address;
        //            field.setCustomValidity("");
        //            dfuseUploadSizeField.max = device.getMaxReadSize(address);
        //        } else {
        //            field.setCustomValidity("Address outside of memory map");
        //        }
        //    } else {
        //        field.setCustomValidity("");
        //    }
        //});

        connectButton.addEventListener('click', function() {
            if (device) {
                device.close().then(onDisconnect);
                device = null;
            } else {
                let filters = [];
                if (serial) {
                    filters.push({ 'serialNumber': serial });
                } else if (vid) {
                    filters.push({ 'vendorId': vid });
                }
                navigator.usb.requestDevice({ 'filters': filters }).then(
                    async selectedDevice => {
                        let interfaces = dfu.findDeviceDfuInterfaces(selectedDevice);
                        if (interfaces.length == 0) {
                            console.log(selectedDevice);
                            statusDisplay.textContent = "The selected device does not have any USB DFU interfaces.";
                        } else if (interfaces.length == 1) {
                            await fixInterfaceNames(selectedDevice, interfaces);
                            device = await connect(new dfu.Device(selectedDevice, interfaces[0]));
                        } else {
                            await fixInterfaceNames(selectedDevice, interfaces);

                            // Choose the first endpoint (alt=0) which should be flash
                            device = await connect(new dfu.Device(selectedDevice, interfaces[0]));
                            /* populateInterfaceList(interfaceForm, selectedDevice, interfaces);
                            async function connectToSelectedInterface() {
                                interfaceForm.removeEventListener('submit', this);
                                const index = interfaceForm.elements["interfaceIndex"].value;
                                device = await connect(new dfu.Device(selectedDevice, interfaces[index]));
                            }

                            interfaceForm.addEventListener('submit', connectToSelectedInterface);

                            interfaceDialog.addEventListener('cancel', function () {
                                interfaceDialog.removeEventListener('cancel', this);
                                interfaceForm.removeEventListener('submit', connectToSelectedInterface);
                            });

                            interfaceDialog.showModal(); */
                        }
                    }
                ).catch(error => {
                    statusDisplay.textContent = error;
                });
            }
        });

/*        detachButton.addEventListener('click', function() {
            if (device) {
                device.detach().then(
                    async len => {
                        let detached = false;
                        try {
                            await device.close();
                            await device.waitDisconnected(5000);
                            detached = true;
                        } catch (err) {
                            console.log("Detach failed: " + err);
                        }

                        onDisconnect();
                        device = null;
                        if (detached) {
                            // Wait a few seconds and try reconnecting
                            setTimeout(autoConnect, 5000);
                        }
                    },
                    async error => {
                        await device.close();
                        onDisconnect(error);
                        device = null;
                    }
                );
            }
        });
	*/
/*
        uploadButton.addEventListener('click', async function(event) {
            event.preventDefault();
            event.stopPropagation();
            if (!configForm.checkValidity()) {
                configForm.reportValidity();
                return false;
            }

            if (!device || !device.device_.opened) {
                onDisconnect();
                device = null;
            } else {
                setLogContext(uploadLog);
                clearLog(uploadLog);
                try {
                    let status = await device.getStatus();
                    if (status.state == dfu.dfuERROR) {
                        await device.clearStatus();
                    }
                } catch (error) {
                    device.logWarning("Failed to clear status");
                }


                try {
                    const blob = await device.do_upload(transferSize, maxUploadSize);
                    saveAs(blob, "firmware.bin");
                } catch (error) {
                    logError(error);
                }

                setLogContext(null);
            }

            return false;
        });
*/
        //firmwareFileField.addEventListener("change", function() {
        //    firmwareFile = null;
        //    if (firmwareFileField.files.length > 0) {
        //        let file = firmwareFileField.files[0];
        //        let reader = new FileReader();
        //        reader.onload = function() {
        //            firmwareFile = reader.result;
        //        };
        //        reader.readAsArrayBuffer(file);
        //    }
        //});

        /*
        downloadButton.addEventListener('click', async function(event) {
            event.preventDefault();
            event.stopPropagation();
            //if (!configForm.checkValidity()) {
            //    configForm.reportValidity();
            //    return false;
           // }
            

            let firmwarePath = firmwarePathField.options[firmwarePathField.selectedIndex].value;

	    // Download binary file to memory
            var req = new XMLHttpRequest();
            req.open('GET', firmwarePath, true);
    	    req.responseType = "blob";
            
	    req.onload = async function(oEvent) {

                let reader = new FileReader();
                reader.onload = async function() {
                    firmwareFile = reader.result;
                    
                    if (device && firmwareFile != null) {
                        setLogContext(downloadLog);
                        clearLog(downloadLog);
                        try {
                            let status = await device.getStatus();
                            if (status.state == dfu.dfuERROR) {
                                await device.clearStatus();
                            }
                        } catch (error) {
                            device.logWarning("Failed to clear status");
                        }
                        await device.do_download(transferSize, firmwareFile, manifestationTolerant).then(
                            () => {
                                logInfo("Your device has been updated! Return the boot jumper to its normal position, if applicable. Unplug/replug the device to start using the new firmware.");
                                setLogContext(null);
                                if (!manifestationTolerant) {
                                    device.waitDisconnected(5000).then(
                                        dev => {
                                            onDisconnect();
                                            device = null;
                                        },
                                        error => {
                                            // It didn't reset and disconnect for some reason...
                                            console.log("Device unexpectedly tolerated manifestation.");
                                        }
                                    );
                                }
                            },
                            error => {
                                logError(error);
                                setLogContext(null);
                            }
                        )
                    }
                };
                reader.readAsArrayBuffer(req.response);

            };
            req.send();

            //return false;
        });

    */
    
        // Check if WebUSB is available
        if (typeof navigator.usb !== 'undefined') {
            navigator.usb.addEventListener("disconnect", onUnexpectedDisconnect);
            // Try connecting automatically
            if (fromLandingPage) {
                //autoConnect(vid, serial);
                autoConnect(parseInt("0x0483", 16), serial);
            }
        } else {
            statusDisplay.textContent = 'WebUSB not available (you must be running Chrome 61 or later to use this updater)'
            connectButton.disabled = true;
        }
        
    
        
    });
})();