# Video Production Guide - Confidential Auction

Complete guide for producing the one-minute demonstration video for the Zama Bounty Track December 2025 submission.

## Video Specifications

- **Duration**: 60 seconds
- **Format**: MP4 (recommended), WebM, or MOV
- **Resolution**: 1080p (1920x1080) minimum
- **Frame Rate**: 30fps or 60fps
- **Audio**: Clear voiceover with background music optional
- **Subtitles**: Recommended for accessibility

## Script Overview

The video script is provided in VIDEO_SCRIPT with:
- 358 words
- Natural speaking pace
- No technical jargon requiring explanation
- Clear narrative structure
- Demonstration of key concepts

## Production Phases

### Phase 1: Preparation

**Script Review**
- Read through VIDEO_SCRIPT
- Time the script (approximately 60 seconds at natural pace)
- Adjust delivery speed as needed
- Prepare for clear enunciation

**Visual Asset Preparation**
- Collect or create demonstration visuals
- Prepare smart contract code snippets
- Get auction UI screenshots or recordings
- Prepare encryption diagrams
- Prepare architecture diagrams

### Phase 2: Recording Voiceover

**Setup**
- Use professional microphone in quiet environment
- Test audio levels
- Perform practice readings
- Record multiple takes for best quality

**Delivery Guidelines**
- Speak clearly and at natural pace
- Maintain professional tone
- Show enthusiasm for the technology
- Pause briefly between major concepts
- Emphasize key terms: FHE, encrypted, privacy, auction

**Audio Processing**
- Normalize audio levels
- Remove background noise
- Add gentle EQ if needed
- Export as WAV for best quality

### Phase 3: Visual Production

**Opening (0-5 seconds)**
- Title card: "Confidential Auction"
- Subtitle: "Advanced FHE Smart Contract"
- Company/Project branding
- Fade to black

**Concept Explanation (5-15 seconds)**
- Show traditional auction problem (visible bids)
- Compare with FHE solution (encrypted bids)
- Visual: Lock icon representing encryption
- Visual: Smart contract code snippet

**How It Works Section (15-45 seconds)**

Step 1: Auction Creation (5 seconds)
- Screen recording: Create new auction
- Show form fields
- Display deployed contract

Step 2: Encrypted Bidding (8 seconds)
- Show bid placement interface
- Highlight encryption happening
- Visual: euint64 data type
- Show multiple bidders participating

Step 3: Winner Determination (8 seconds)
- Visual: Homomorphic comparison operation
- Show: FHE.gt() function
- Highlight: Highest bid found without decryption
- Show: Winner identified

Step 4: Automation & Documentation (8 seconds)
- Show: create-fhevm-example.ts code
- Show: generate-docs.ts execution
- Display: Generated documentation
- Show: Automated test execution

Step 5: Testing & Quality (8 seconds)
- Show: Test suite execution
- Display: 50+ test cases passing
- Show: Coverage report (>85%)
- Visual: CI/CD pipeline

**Closing (45-60 seconds)**
- Conclusion slide summarizing key points
- Technology highlight: "Zama FHE"
- Call to action: Visit documentation
- Contact/Resources information
- Company branding

## Scene-by-Scene Breakdown

### Scene 1: Title
- Duration: 3 seconds
- Text: "Confidential Auction"
- Text: "Advanced FHEVM Implementation"
- Background: Gradient or blockchain themed

### Scene 2: Problem Statement
- Duration: 4 seconds
- Visual: Traditional auction with visible bids
- Text: "Problem: Bid amounts visible"
- Transition to FHE solution

### Scene 3: FHE Solution
- Duration: 3 seconds
- Visual: Encrypted bids (lock icons)
- Text: "Solution: Complete bid privacy"
- Show encryption symbols

### Scene 4: System Demo
- Duration: 20 seconds
- Show actual smart contract interface
- Demo each major operation
- Highlight encrypted values

### Scene 5: Technical Innovation
- Duration: 15 seconds
- Show code examples
- Highlight homomorphic operations
- Demonstrate test coverage

### Scene 6: Closing
- Duration: 15 seconds
- Summary of capabilities
- Technology stack
- Call to action

## Visual Assets Checklist

### Required Visuals

- Smart contract code editor view
- Auction interface/UI mockup
- Encryption visualization
- Homomorphic comparison diagram
- Test execution console
- Documentation generation output
- Architecture diagram
- Company/project branding

### Optional Enhancements

- Animated data flow diagrams
- 3D blockchain visualization
- Lock/unlock animations for encryption
- Progress indicators for operations
- Charts showing test coverage
- Live network activity visualization

## Audio Specifications

### Voiceover
- Quality: 16-bit, 48kHz minimum
- Format: WAV or MP3 (high quality)
- Level: -3dB to -6dB peak (avoiding clipping)
- Equalization: Slight presence boost (2-4kHz)

### Background Music (Optional)
- Duration: Full 60 seconds
- Volume: -18dB to -12dB below voiceover
- Style: Ambient, tech, or corporate
- Avoid: Distracting or unprofessional music
- Recommendations:
  - Kevin MacLeod (incompetech.com) - Royalty free
  - Epidemic Sound
  - Artlist.io

### Sound Effects (Optional)
- Notification sounds for actions
- Click/type sounds for interactions
- Success chimes for completed operations
- Volume: -24dB to -18dB (subtle)

## Color Scheme Recommendations

### Professional Palette
- Primary: Blue (#0066CC) - Trust, technology
- Secondary: Cyan (#00CCFF) - FHE/Encryption
- Accent: Green (#00CC66) - Success/Positive
- Background: Dark gray (#1a1a1a) - Modern
- Text: White (#FFFFFF) - High contrast

### Text Styling
- Font: Modern sans-serif (Arial, Helvetica, or similar)
- Size: Large enough to read at 60 seconds content
- Weight: Bold for key terms, Regular for body
- Color: White on dark backgrounds
- Shadow: Slight drop shadow for depth

## Shooting Recommendations

### Equipment
- Monitor/Display: 1920x1080 minimum
- Recording Software: OBS Studio (free), ScreenFlow, Camtasia
- Audio Equipment: USB microphone minimum
- Editing Software: DaVinci Resolve (free), Adobe Premiere, Final Cut Pro

### Screen Recording Settings
- Resolution: 1920x1080 (1080p)
- Frame Rate: 30fps (stable) or 60fps (smooth)
- Color Depth: 24-bit or 32-bit
- Monitor: Single monitor, full screen
- Clean desktop: Minimal distractions

### Environment
- Quiet recording space
- Consistent lighting
- Professional background
- No notifications/interruptions
- Clean desktop view

## Editing Workflow

### Step 1: Import Assets
- Import voiceover track
- Import screen recordings
- Import visual assets
- Import background music

### Step 2: Arrange Timeline
- Place voiceover on primary audio track
- Sync video to voiceover timing
- Arrange transitions between scenes
- Add background music to secondary track

### Step 3: Add Effects
- Add title animations (fade in)
- Add transitions (0.3-0.5 seconds)
- Color correction if needed
- Add overlays for emphasis
- Add text/captions

### Step 4: Audio Mixing
- Balance voiceover level (-3dB to -6dB)
- Set background music level (-18dB to -12dB)
- Fade in/out background music
- Add audio transitions
- Remove pops and clicks

### Step 5: Finalization
- Export to 1080p MP4
- Check quality at full resolution
- Verify audio sync
- Add subtitles
- Create thumbnail/preview image

## Export Settings

### MP4 Codec
```
Video Codec: H.264
Bitrate: 8000-12000 kbps
Resolution: 1920x1080
Frame Rate: 30fps
Audio Codec: AAC
Audio Bitrate: 192 kbps
Sample Rate: 48kHz
```

### File Size Target
- Typical file size: 60-120MB
- Keep under 200MB for easy distribution
- Optimize for both web and local storage

## Delivery Formats

### Primary Format
- **File**: MP4 with H.264 video and AAC audio
- **Resolution**: 1920x1080 (1080p)
- **Frame Rate**: 30fps
- **Audio**: Stereo, 48kHz

### Alternative Formats
- WebM: VP9 codec, Vorbis audio
- MOV: ProRes codec, AAC audio (for archiving)
- YouTube-optimized: MP4, 30fps, stereo

## Distribution Checklist

Before final submission:

- [ ] Video duration verified (60 seconds ±2 seconds)
- [ ] Audio levels checked (no clipping)
- [ ] Video synchronized with voiceover
- [ ] Text readable at target resolution
- [ ] Color grading consistent
- [ ] No spelling errors in graphics
- [ ] Background music at appropriate level
- [ ] File format meets requirements
- [ ] File size acceptable
- [ ] Thumbnail/preview image created
- [ ] Subtitles generated and synchronized

## Troubleshooting

### Audio Issues
- **Problem**: Audio out of sync with video
- **Solution**: Re-sync in editing software, adjust timeline

- **Problem**: Voiceover too quiet
- **Solution**: Increase volume level, re-record if necessary

- **Problem**: Background hum/noise
- **Solution**: Use noise reduction filter in editing software

### Video Issues
- **Problem**: Screen recording choppy
- **Solution**: Record at lower resolution or reduce screen clutter

- **Problem**: Text unreadable
- **Solution**: Increase text size or use larger fonts

- **Problem**: Colors washed out
- **Solution**: Adjust gamma/levels in editing software

### Performance Issues
- **Problem**: File too large
- **Solution**: Reduce bitrate or resolution

- **Problem**: Encoding takes too long
- **Solution**: Use hardware acceleration if available

## Time Allocation Examples

For a 60-second video produced in professional editing software:

- Planning & Scripting: 1-2 hours
- Recording Voiceover: 1 hour (including takes)
- Screen Recording: 2-3 hours (multiple takes)
- Visual Asset Preparation: 3-4 hours
- Editing & Assembly: 4-5 hours
- Audio Mixing: 1-2 hours
- Color Grading: 1 hour
- Final Review & Export: 1 hour

**Total Estimated Time**: 14-18 hours for professional quality

## Software Recommendations

### Free Options
- **Editing**: DaVinci Resolve (powerful)
- **Screen Recording**: OBS Studio
- **Audio Editing**: Audacity

### Paid Options
- **Professional Editing**: Adobe Premiere Pro, Final Cut Pro
- **Screen Recording**: Camtasia, ScreenFlow
- **Complete Suite**: Adobe Creative Cloud

## Final Notes

- Keep voiceover clear and professional
- Show actual code and working demonstrations
- Emphasize unique FHE aspects
- Highlight automation tools
- End with strong call to action
- Consider accessibility (subtitles, clear audio)

This video should effectively communicate the technical sophistication and practical applications of the Confidential Auction project to competition judges and the broader developer community.

---

For detailed script, see VIDEO_SCRIPT
For project information, see README.md and SUBMISSION_OVERVIEW.md
