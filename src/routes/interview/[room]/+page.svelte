<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { page } from '$app/state';

  export let data;
  let localVideo: HTMLVideoElement;
  let remoteVideo: HTMLVideoElement;
  let localStream: MediaStream | null = null;
  let peer: RTCPeerConnection | null = null;
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let muted = false;
  let cameraOff = false;
  let connected = false;
  let errorMessage = '';

  const rtcConfig: RTCConfiguration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

  async function send(type: string, payload: unknown) { await channel?.send({ type: 'broadcast', event: type, payload }); }

  async function createPeer() {
    peer = new RTCPeerConnection(rtcConfig);
    peer.onicecandidate = (event) => { if (event.candidate) send('ice', event.candidate.toJSON()); };
    peer.ontrack = (event) => { if (remoteVideo && event.streams[0]) remoteVideo.srcObject = event.streams[0]; connected = true; };
    localStream?.getTracks().forEach((track) => peer?.addTrack(track, localStream!));
  }

  async function createOffer() {
    if (!peer) await createPeer();
    const offer = await peer!.createOffer();
    await peer!.setLocalDescription(offer);
    await send('offer', offer);
  }

  async function joinRoom() {
    channel = supabase.channel(`interview:${page.params.room}`, { config: { private: true, broadcast: { self: false } } });
    channel.on('broadcast', { event: 'request-offer' }, async () => { if (data.role === 'interviewer') await createOffer(); })
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (data.role !== 'candidate') return;
        if (!peer) await createPeer();
        await peer!.setRemoteDescription(payload);
        const answer = await peer!.createAnswer();
        await peer!.setLocalDescription(answer);
        await send('answer', answer);
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => { if (data.role === 'interviewer' && peer) await peer.setRemoteDescription(payload); })
      .on('broadcast', { event: 'ice' }, async ({ payload }) => { if (peer) { try { await peer.addIceCandidate(payload); } catch {} } })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;
        if (data.role === 'candidate') await send('request-offer', { at: Date.now() });
        if (data.role === 'interviewer') await createPeer();
      });
  }

  async function start() {
    errorMessage = '';
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideo.srcObject = localStream;
      await joinRoom();
    } catch {
      errorMessage = 'Camera or microphone access was blocked. Allow access in your browser and try again.';
    }
  }

  function toggleMic() { muted = !muted; localStream?.getAudioTracks().forEach((track) => track.enabled = !muted); }
  function toggleCamera() { cameraOff = !cameraOff; localStream?.getVideoTracks().forEach((track) => track.enabled = !cameraOff); }
  function leave() { localStream?.getTracks().forEach((track) => track.stop()); peer?.close(); if (channel) supabase.removeChannel(channel); window.location.href = '/'; }

  onMount(() => () => { localStream?.getTracks().forEach((track) => track.stop()); peer?.close(); if (channel) supabase.removeChannel(channel); });
</script>

<svelte:head><title>Interview room — Origins</title></svelte:head>
<div class="room">
  <header><div><span class="eyebrow">ORIGINS INTERVIEW ROOM</span><h1>{data.interview.title}</h1><p>{data.job?.title} · {data.interviewer?.fullName}</p></div><span class="secure">Private room · {data.interview.roomCode}</span></header>
  <main class="stage"><div class="remote"><video bind:this={remoteVideo} autoplay playsinline></video>{#if !connected}<div class="waiting"><span>O</span><b>Waiting for the other participant…</b><small>Your camera preview is ready below.</small></div>{/if}<span class="remote-label">Remote participant</span></div><div class="local"><video bind:this={localVideo} autoplay muted playsinline></video>{#if cameraOff}<div class="camera-off">Camera off</div>{/if}<small>You</small></div><div class="controls"><button class:off={muted} onclick={toggleMic}>{muted ? 'Mic off' : 'Mic'}</button><button class:off={cameraOff} onclick={toggleCamera}>{cameraOff ? 'Camera off' : 'Camera'}</button>{#if !localStream}<button class="join" onclick={start}>Join with camera</button>{/if}<button class="leave" onclick={leave}>Leave</button></div></main>
  <aside><span class="eyebrow">SESSION</span><h2>{data.role === 'interviewer' ? data.applicant?.fullName ?? 'Candidate' : data.profile.fullName}</h2><p>{data.role === 'interviewer' ? `${data.job?.title ?? 'Candidate'} · Candidate` : `Origins · ${data.interviewer?.fullName ?? 'Recruiter'}`}</p><div class="status"><i></i>{connected ? 'Connected' : 'Waiting to connect'}</div>{#if errorMessage}<div class="error">{errorMessage}</div>{/if}<div class="note"><b>Private interview</b><small>Room access is verified against your authenticated Supabase profile and the interview record. There is no role query parameter.</small></div></aside>
</div>
<style>
  :global(body){margin:0;background:#050b08;color:#f5f7f4;font-family:Inter,system-ui,sans-serif}.room{min-height:100vh;background:radial-gradient(circle at 75% 0,rgba(32,228,141,.08),transparent 28%),#050b08;display:grid;grid-template-columns:1fr 280px;grid-template-rows:auto 1fr;padding:22px;gap:18px}header{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;padding:5px 4px 0}h1{font:500 30px Georgia,serif;margin:8px 0 0}.eyebrow{font-size:9px;letter-spacing:.16em;color:#20e48d;font-weight:800}.secure{font-size:8px;color:#8aa096}.stage{position:relative;border:1px solid rgba(255,255,255,.1);border-radius:10px;overflow:hidden;background:#0a1711;min-height:calc(100vh - 125px)}.remote{position:absolute;inset:0;display:grid;place-items:center}.remote video{width:100%;height:100%;object-fit:cover}.waiting{position:absolute;text-align:center;display:grid;gap:8px}.waiting span{width:70px;height:70px;border-radius:50%;display:grid;place-items:center;margin:auto;background:#16372a;color:#69d9a6;font:26px Georgia}.waiting b{font-size:11px}.waiting small{font-size:8px;color:#83978b}.remote-label{position:absolute;bottom:18px;left:18px;font-size:8px;color:#c1cdc7}.local{position:absolute;right:18px;top:18px;width:210px;height:145px;border:1px solid rgba(255,255,255,.14);border-radius:8px;overflow:hidden;background:#112219}.local video{width:100%;height:100%;object-fit:cover}.local small{position:absolute;bottom:6px;left:8px;font-size:7px}.camera-off{position:absolute;inset:0;display:grid;place-items:center;background:#112219;font-size:9px;color:#9bad9f}.controls{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:7px}.controls button{border:1px solid rgba(255,255,255,.13);background:#14271f;color:#fff;border-radius:7px;padding:10px 13px;font-size:8px}.controls .off{background:#49302d}.controls .join{background:#20e48d;color:#06130d;border-color:#20e48d}.controls .leave{background:#a94740;border-color:#a94740}aside{border:1px solid rgba(255,255,255,.1);background:#0c1a13;border-radius:10px;padding:22px}aside h2{font:500 25px Georgia,serif;margin:10px 0 4px}aside p{font-size:8px;color:#83978b}.status{display:flex;gap:7px;align-items:center;margin-top:22px;padding:9px;border:1px solid rgba(32,228,141,.15);border-radius:7px;font-size:8px;color:#8fe4bc}.status i{width:6px;height:6px;background:#20e48d;border-radius:50%}.note{border-top:1px solid rgba(255,255,255,.08);margin-top:22px;padding-top:18px}.note b,.note small{display:block}.note b{font-size:8px}.note small{font-size:7px;color:#73877b;line-height:1.6;margin-top:6px}.error{margin-top:15px;color:#f0ad9e;font-size:8px;line-height:1.5}@media(max-width:800px){.room{display:block;padding:12px}.stage{margin-top:18px;min-height:70vh}.local{width:120px;height:90px}aside{margin-top:12px}}
</style>
