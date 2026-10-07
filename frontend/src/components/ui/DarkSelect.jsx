import { Children, isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

const flattenOptions = (children) => Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return [];
    if (child.type === "option") {
        return [{
            value: child.props.value ?? child.props.children,
            label: child.props.children,
            disabled: Boolean(child.props.disabled),
        }];
    }
    if (child.props?.children) return flattenOptions(child.props.children);
    return [];
});

const DarkSelect = ({
    value,
    onChange,
    name,
    children,
    className = "",
    disabled = false,
    "aria-label": ariaLabel,
}) => {
    const [open, setOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState({});
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const listboxId = useId();
    const options = useMemo(() => flattenOptions(children), [children]);
    const selected = options.find((option) => String(option.value) === String(value));

    const positionMenu = useCallback(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        const availableBelow = window.innerHeight - rect.bottom - 12;
        const maxHeight = Math.min(280, Math.max(150, window.innerHeight - 32));
        const opensAbove = availableBelow < 190 && rect.top > availableBelow;
        setMenuStyle({
            left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
            width: rect.width,
            maxHeight,
            ...(opensAbove
                ? { bottom: window.innerHeight - rect.top + 6 }
                : { top: rect.bottom + 6 }),
        });
    }, []);

    useEffect(() => {
        if (!open) return undefined;
        positionMenu();
        const dismiss = (event) => {
            if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
        };
        const reposition = () => positionMenu();
        document.addEventListener("pointerdown", dismiss);
        window.addEventListener("resize", reposition);
        window.addEventListener("scroll", reposition, true);
        return () => {
            document.removeEventListener("pointerdown", dismiss);
            window.removeEventListener("resize", reposition);
            window.removeEventListener("scroll", reposition, true);
        };
    }, [open, positionMenu]);

    const choose = (option) => {
        if (option.disabled) return;
        onChange?.({ target: { name, value: option.value, type: "select-one" } });
        setOpen(false);
        triggerRef.current?.focus();
    };

    const onKeyDown = (event) => {
        if (event.key === "Escape") {
            setOpen(false);
            return;
        }
        if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            if (!open) {
                setOpen(true);
                return;
            }
            const enabled = options.filter((option) => !option.disabled);
            const current = enabled.findIndex((option) => String(option.value) === String(value));
            const direction = event.key === "ArrowUp" ? -1 : 1;
            const next = enabled[(current + direction + enabled.length) % enabled.length];
            if (next) choose(next);
        }
    };

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listboxId}
                onClick={() => { positionMenu(); setOpen((current) => !current); }}
                onKeyDown={onKeyDown}
                className={`relative flex items-center text-left outline-none disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            >
                <span className="min-w-0 flex-1 truncate">{selected?.label ?? "Select option"}</span>
                <ChevronDown className={`ml-2 h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180 text-cyan-300" : ""}`} />
            </button>

            {open && createPortal(
                <div
                    ref={menuRef}
                    id={listboxId}
                    role="listbox"
                    style={menuStyle}
                    className="fixed z-[5000] overflow-y-auto rounded-xl border border-cyan-300/15 bg-[#07111f]/[0.98] p-1.5 shadow-[0_22px_70px_rgba(0,0,0,.65)] backdrop-blur-xl"
                >
                    {options.map((option, index) => {
                        const active = String(option.value) === String(value);
                        return (
                            <button
                                key={`${String(option.value)}-${index}`}
                                type="button"
                                role="option"
                                aria-selected={active}
                                disabled={option.disabled}
                                onClick={() => choose(option)}
                                className={`flex min-h-9 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition ${active ? "bg-cyan-400/12 text-cyan-200" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"} disabled:cursor-not-allowed disabled:text-slate-700`}
                            >
                                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                                {active && <Check className="h-3.5 w-3.5 shrink-0 text-cyan-300" strokeWidth={2.5} />}
                            </button>
                        );
                    })}
                </div>,
                document.body,
            )}
        </>
    );
};

export default DarkSelect;
