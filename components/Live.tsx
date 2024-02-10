import React, { use, useCallback, useEffect, useState } from "react";
import LiveCursors from "./cursor/LiveCursors";
import {
	useBroadcastEvent,
	useEventListener,
	useMyPresence,
	useOthers,
} from "@/liveblocks.config";
import CursorChat from "./cursor/CursorChat";
import { CursorMode, CursorState, Reaction, ReactionEvent } from "@/types/type";
import ReactionSelector from "./reaction/ReactionSelector";
import FlyingReaction from "./reaction/FlyingReaction";
import useInterval from "@/hooks/useInterval";
import Cursor from "./cursor/Cursor";

const Live = () => {
	const others = useOthers();
	const broadcast = useBroadcastEvent();

	const [{ cursor }, updateMyPresence] = useMyPresence() as any;

	const [cursorState, setCursorState] = useState<CursorState>({
		mode: CursorMode.Hidden,
	});

	const [reactions, setReactions] = useState<Reaction[]>([]);

	const handlePointerMove = useCallback((event: React.PointerEvent) => {
		event.preventDefault();

		if (cursor == null || cursorState.mode !== CursorMode.ReactionSelector) {
			const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
			const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

			updateMyPresence({ cursor: { x, y } });
		}
	}, []);

	const handlePointerLeave = useCallback((event: React.PointerEvent) => {
		setCursorState({ mode: CursorMode.Hidden });

		updateMyPresence({ cursor: null, message: null });
	}, []);

	const handlePointerDown = useCallback(
		(event: React.PointerEvent) => {
			const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
			const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

			updateMyPresence({ cursor: { x, y } });

			setCursorState((state: CursorState) =>
				cursorState.mode === CursorMode.Reaction
					? { ...state, isPressed: true }
					: state
			);
		},
		[cursorState.mode, setCursorState]
	);

	const handlePointerUp = useCallback(
		(event: React.PointerEvent) => {
			setCursorState((state: CursorState) =>
				cursorState.mode === CursorMode.Reaction
					? { ...state, isPressed: true }
					: state
			);
		},
		[cursorState.mode, setCursorState]
	);

	const setReaction = useCallback((reaction: string) => {
		setCursorState({
			mode: CursorMode.Reaction,
			reaction,
			isPressed: false,
		});
	}, []);

	let currentModeSelection: number;

	useEffect(() => {
		const onKeyUp = (e: KeyboardEvent) => {
			if (e.key === "/" && currentModeSelection !== CursorMode.Chat) {
				setCursorState({
					mode: CursorMode.Chat,
					previousMessage: null,
					message: "",
				});
				currentModeSelection = CursorMode.Chat;
			} else if (e.key === "Escape") {
				updateMyPresence({ message: "" });
				setCursorState({ mode: CursorMode.Hidden });
				currentModeSelection = CursorMode.Hidden;
			} else if (e.key === "e" && currentModeSelection !== CursorMode.Chat) {
				setCursorState({
					mode: CursorMode.ReactionSelector,
				});
				currentModeSelection = CursorMode.ReactionSelector;
			}
		};
		const onKeyDown = (e: KeyboardEvent) => {
			console.log(currentModeSelection);
			if (e.key === "/" && currentModeSelection !== CursorMode.Chat) {
				e.preventDefault();
			}
		};

		window.addEventListener("keyup", onKeyUp);
		window.addEventListener("keydown", onKeyDown);

		return () => {
			window.removeEventListener("keyup", onKeyUp);
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [updateMyPresence]);

	useInterval(() => {
		setReactions((reactions) =>
			reactions.filter((reaction) => reaction.timestamp > Date.now() - 4000)
		);
	}, 1000);

	useInterval(() => {
		if (cursorState.mode === CursorMode.Reaction && cursorState && cursor) {
			setReactions((reactions) =>
				reactions.concat([
					{
						point: { x: cursor.x, y: cursor.y },
						timestamp: Date.now(),
						value: cursorState.reaction,
					},
				])
			);

			broadcast({
				x: cursor.x,
				y: cursor.y,
				value: cursorState.reaction,
			});
		}
	}, 100);

	useEventListener((eventData) => {
		const event = eventData.event as ReactionEvent;
		setReactions((reactions) => {
			return reactions.concat([
				{
					point: { x: event.x, y: event.y },
					timestamp: Date.now(),
					value: event.value,
				},
			]);
		});
	});

	return (
		<div
			className="relative h-screen w-full flex touch-none justify-center items-center text-center"
			onPointerMove={handlePointerMove}
			onPointerLeave={handlePointerLeave}
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerUp}
		>
			<h1>LIVE LIVE LIVE</h1>

			{reactions.map((reaction) => {
				return (
					<FlyingReaction
						key={reaction.timestamp.toString()}
						x={reaction.point.x}
						y={reaction.point.y}
						timestamp={reaction.timestamp}
						value={reaction.value}
					/>
				);
			})}

			{cursor && (
				<CursorChat
					cursor={cursor}
					cursorState={cursorState}
					setCursorState={setCursorState}
					updateMyPresence={updateMyPresence}
				/>
			)}

			{cursorState.mode === CursorMode.ReactionSelector && (
				<ReactionSelector
					setReaction={(reaction) => {
						setReaction(reaction);
					}}
				/>
			)}

			<LiveCursors others={others} />
		</div>
	);
};

export default Live;
