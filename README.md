替换`node_modules\@ionic\core\dist\esm\index-7a8b7a1c.js`
```javascript
const getHostRef = (ref) => ref.__hostRef__;
const registerInstance = (lazyInstance, hostRef) => {
    hostRef.$lazyInstance$ = lazyInstance;
    lazyInstance.__hostRef__ = hostRef;
};
const registerHost = (elm, cmpMeta) => {
    const hostRef = {
        $flags$: 0,
        $hostElement$: elm,
        $cmpMeta$: cmpMeta,
        $instanceValues$: new Map(),
    };
    {
        hostRef.$onInstancePromise$ = new Promise(r => (hostRef.$onInstanceResolve$ = r));
    }
    {
        hostRef.$onReadyPromise$ = new Promise(r => (hostRef.$onReadyResolve$ = r));
        elm['s-p'] = [];
        elm['s-rc'] = [];
    }
    addHostEventListeners(elm, hostRef, cmpMeta.$listeners$);
    elm.__hostRef__ = hostRef;
};
```