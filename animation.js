"use strict"

function UpdateAnimation (time)
{
        var root = g_bones[0];

        root[g_BONE_LOCAL_POSITION][0] = ChannelEvaluate(time, 0);
        root[g_BONE_LOCAL_POSITION][1] = ChannelEvaluate(time, 1);
        root[g_BONE_LOCAL_POSITION][2] = ChannelEvaluate(time, 2);

        var num_of_bones = g_bones.length;
        for (var bone_idx = 0; bone_idx < num_of_bones; ++bone_idx)
        {
                var bone = g_bones[bone_idx];
                bone[g_BONE_LOCAL_ROTATION][0] = ChannelEvaluate(time, bone_idx * 3 + 3);
                bone[g_BONE_LOCAL_ROTATION][1] = ChannelEvaluate(time, bone_idx * 3 + 4);
                bone[g_BONE_LOCAL_ROTATION][2] = ChannelEvaluate(time, bone_idx * 3 + 5);
        }

        CalcModelMatrix(0, Matrix.I(4));

        wasp_world_positions = [];
        wasp_world_normals = [];

        for (var idx = 0; idx < g_skin_vertices.length; ++idx)
        {
                var world_position = CalcWorldPosition(idx);
                wasp_world_positions.push(world_position.e(1));
                wasp_world_positions.push(world_position.e(2));
                wasp_world_positions.push(world_position.e(3));

                var world_normal = CalcWorldNormal(idx);
                wasp_world_normals.push(world_normal.e(1));
                wasp_world_normals.push(world_normal.e(2));
                wasp_world_normals.push(world_normal.e(3));
        }
}

function PrecomputeKeyframeCoefficients ()
{
        var num_of_channels = g_anim_channels.length;

        for (var channel_idx = 0; channel_idx < num_of_channels; ++channel_idx)
        {
                var keyframes = g_anim_channels[channel_idx][g_CHANNEL_KEYFRAMES];
                var num_of_keyframes = keyframes.length;

                for (var keyframe_idx = 0; keyframe_idx < num_of_keyframes; ++keyframe_idx)
                {
                        CalcTangentIn(keyframes, keyframe_idx);
                        CalcTangentOut(keyframes, keyframe_idx);
                        CalcCoefficients(keyframes, keyframe_idx);
                }
        }
}

function CalcTangentIn (keyframes, keyframe_idx)
{
        if (0 >= keyframe_idx)
        {
                return;
        }

        var num_of_keyframes = keyframes.length;

        var cur_keyframe = keyframes[keyframe_idx];
        var prev_keyframe = keyframes[keyframe_idx - 1];
        var next_keyframe = null;

        var cur_keyframe_time = cur_keyframe[g_KEYFRAME_TIME];
        var cur_keyframe_value = cur_keyframe[g_KEYFRAME_VALUE];
        var prev_keyframe_time = prev_keyframe[g_KEYFRAME_TIME];
        var prev_keyframe_value = prev_keyframe[g_KEYFRAME_VALUE];
        var next_keyframe_time = null;
        var next_keyframe_value = null;

        if (num_of_keyframes > keyframe_idx + 1)
        {
                next_keyframe = keyframes[keyframe_idx + 1];
                next_keyframe_time = next_keyframe[g_KEYFRAME_TIME];
                next_keyframe_value = next_keyframe[g_KEYFRAME_VALUE];
        }

        var tangent_in_type = cur_keyframe[g_KEYFRAME_TANGENT_IN_TYPE];
        var tangent_in_value = 0.0;

        switch (tangent_in_type)
        {
                case g_TANGENT_TYPE_FLAT:
                        tangent_in_value = 0.0;
                        break;
                case g_TANGENT_TYPE_LINEAR:
                        tangent_in_value = (cur_keyframe_value - prev_keyframe_value) / (cur_keyframe_time - prev_keyframe_time);
                        break;
                case g_TANGENT_TYPE_SMOOTH:
                        if (null == next_keyframe)
                        {
                                tangent_in_value = (cur_keyframe_value - prev_keyframe_value) / (cur_keyframe_time - prev_keyframe_time);
                        }
                        else
                        {
                                tangent_in_value = (next_keyframe_value - prev_keyframe_value) / (next_keyframe_time - prev_keyframe_time);
                        }
                        break;
                default:
                        alert("unhandled tangent type: " + tangent_in_type);
                        break;
        }

        cur_keyframe[g_KEYFRAME_TANGENT_IN_VALUE] = tangent_in_value;
}

function CalcTangentOut (keyframes, keyframe_idx)
{
        var num_of_keyframes = keyframes.length;

        if (num_of_keyframes - 1 <= keyframe_idx)
        {
                return;
        }

        var num_of_keyframes = keyframes.length;

        var cur_keyframe = keyframes[keyframe_idx];
        var prev_keyframe = null;
        var next_keyframe = keyframes[keyframe_idx + 1];

        var cur_keyframe_time = cur_keyframe[g_KEYFRAME_TIME];
        var cur_keyframe_value = cur_keyframe[g_KEYFRAME_VALUE];
        var prev_keyframe_time = null;
        var prev_keyframe_value = null;
        var next_keyframe_time = next_keyframe[g_KEYFRAME_TIME];
        var next_keyframe_value = next_keyframe[g_KEYFRAME_VALUE];

        if (0 <= keyframe_idx - 1)
        {
                prev_keyframe = keyframes[keyframe_idx - 1];
                prev_keyframe_time = prev_keyframe[g_KEYFRAME_TIME];
                prev_keyframe_value = prev_keyframe[g_KEYFRAME_VALUE];
        }

        var tangent_out_type = cur_keyframe[g_KEYFRAME_TANGENT_OUT_TYPE];
        var tangent_out_value = 0.0;

        switch (tangent_out_type)
        {
                case g_TANGENT_TYPE_FLAT:
                        tangent_out_value = 0.0;
                        break;
                case g_TANGENT_TYPE_LINEAR:
                        tangent_out_value = (next_keyframe_value - cur_keyframe_value) / (next_keyframe_time - cur_keyframe_time);
                        break;
                case g_TANGENT_TYPE_SMOOTH:
                        if (null == prev_keyframe)
                        {
                                tangent_out_value = (next_keyframe_value - cur_keyframe_value) / (next_keyframe_time - cur_keyframe_time);
                        }
                        else
                        {
                                tangent_out_value = (next_keyframe_value - prev_keyframe_value) / (next_keyframe_time - prev_keyframe_time);
                        }
                        break;
                default:
                        alert("unhandled tangent type: " + tangent_out_type);
                        break;
        }

        cur_keyframe[g_KEYFRAME_TANGENT_OUT_VALUE] = tangent_out_value;
}

function CalcCoefficients (keyframes, keyframe_idx)
{
        if (0 >= keyframe_idx)
        {
                return;
        }

        var cur_keyframe = keyframes[keyframe_idx];
        var prev_keyframe = keyframes[keyframe_idx - 1];

        var cur_keyframe_time = cur_keyframe[g_KEYFRAME_TIME];
        var cur_keyframe_value = cur_keyframe[g_KEYFRAME_VALUE];
        var cur_keyframe_tangent_in_value = cur_keyframe[g_KEYFRAME_TANGENT_IN_VALUE];

        var prev_keyframe_time = prev_keyframe[g_KEYFRAME_TIME];
        var prev_keyframe_value = prev_keyframe[g_KEYFRAME_VALUE];
        var prev_keyframe_tangent_out_value = prev_keyframe[g_KEYFRAME_TANGENT_OUT_VALUE];

        var delta_time = cur_keyframe_time - prev_keyframe_time;
        var coeff_a = 2 * prev_keyframe_value - 2 * cur_keyframe_value + delta_time * prev_keyframe_tangent_out_value +  delta_time * cur_keyframe_tangent_in_value;
        var coeff_b = -3 * prev_keyframe_value + 3 * cur_keyframe_value - 2 * delta_time * prev_keyframe_tangent_out_value - delta_time * cur_keyframe_tangent_in_value;
        var coeff_c = delta_time * prev_keyframe_tangent_out_value;
        var coeff_d = prev_keyframe_value;

        cur_keyframe[g_KEYFRAME_COEFF_A] = coeff_a;
        cur_keyframe[g_KEYFRAME_COEFF_B] = coeff_b;
        cur_keyframe[g_KEYFRAME_COEFF_C] = coeff_c;
        cur_keyframe[g_KEYFRAME_COEFF_D] = coeff_d;
}

function ChannelEvaluate (time, channel_idx)
{
        var keyframes = g_anim_channels[channel_idx][g_CHANNEL_KEYFRAMES];
        var num_of_keyframes = keyframes.length;

        if (0 == num_of_keyframes)
        {
                alert("no key frame");
                return;
        }
        
        if (1 == num_of_keyframes)
        {
                return keyframes[0][g_KEYFRAME_VALUE];
        }

        if (time < keyframes[0][g_KEYFRAME_TIME] || time > keyframes[num_of_keyframes - 1][g_KEYFRAME_TIME])
        {
                return Extrapolate(time, channel_idx);
        }

        var value = 0.0;
        for (var keyframe_idx = 0; keyframe_idx < num_of_keyframes; ++keyframe_idx)
        {
                if (time > keyframes[keyframe_idx][g_KEYFRAME_TIME])
                {
                        continue;
                }

                if (0 == keyframe_idx)
                {
                        value = Evaluate(time, keyframes[0], keyframes[1]);
                }
                else
                {
                        value = Evaluate(time, keyframes[keyframe_idx - 1], keyframes[keyframe_idx]);
                }
                break;
        }

        return value;
}

function Evaluate (time, keyframe_zero, keyframe_one)
{
        var keyframe_zero_time = keyframe_zero[g_KEYFRAME_TIME];
        var keyframe_one_time = keyframe_one[g_KEYFRAME_TIME];

        var u = (time - keyframe_zero_time) / (keyframe_one_time - keyframe_zero_time);

        var coeff_a = keyframe_one[g_KEYFRAME_COEFF_A];
        var coeff_b = keyframe_one[g_KEYFRAME_COEFF_B];
        var coeff_c = keyframe_one[g_KEYFRAME_COEFF_C];
        var coeff_d = keyframe_one[g_KEYFRAME_COEFF_D];

        return coeff_d + u * (coeff_c + u * (coeff_b + u * coeff_a));
}

function Extrapolate (time, channel_idx)
{
        var extrap_in = g_anim_channels[channel_idx][g_CHANNEL_EXTRAP_IN];
        var extrap_out = g_anim_channels[channel_idx][g_CHANNEL_EXTRAP_OUT];
        var keyframes = g_anim_channels[channel_idx][g_CHANNEL_KEYFRAMES];

        var first_keyframe = keyframes[0];
        var first_keyframe_time = first_keyframe[g_KEYFRAME_TIME];
        var first_keyframe_value = first_keyframe[g_KEYFRAME_VALUE];

        var last_keyframe = keyframes[keyframes.length - 1];
        var last_keyframe_time = last_keyframe[g_KEYFRAME_TIME];
        var last_keyframe_value = last_keyframe[g_KEYFRAME_VALUE];

        if (time < first_keyframe_time)
        {
                if (g_EXTRAP_TYPE_CONSTANT == extrap_in)
                {
                        return first_keyframe_value;
                }
                else if (g_EXTRAP_TYPE_LINEAR == extrap_in)
                {
                        return first_keyframe_value - (first_keyframe_time - time) * first_keyframe[g_KEYFRAME_TANGENT_OUT_VALUE];
                }
                else if (g_EXTRAP_TYPE_CYCLE == extrap_in)
                {
                        var time_interval = last_keyframe_time - first_keyframe_time;
                        var count = parseInt((first_keyframe_time - time) / time_interval);
                        time += (1 + count) * time_interval;
                        return ChannelEvaluate(time, channel_idx);
                }
                else if (g_EXTRAP_TYPE_CYCLE_OFFSET == extrap_in)
                {
                        var time_interval = last_keyframe_time - first_keyframe_time;
                        var count = parseInt((first_keyframe_time - time) / time_interval);
                        time += (1 + count) * time_interval;
                        return Evaluate(time, channel_idx) - (1 + count) * (last_keyframe_value - first_keyframe_value);
                }
                else
                {
                        alert("unhandled extrap_in type: " + extrap_in);
                }

                return first_keyframe_value;
        }

        if (time > last_keyframe_time)
        {
                if (g_EXTRAP_TYPE_CONSTANT == extrap_out)
                {
                        return last_keyframe_value;
                }
                else if (g_EXTRAP_TYPE_LINEAR == extrap_out)
                {
                        return last_keyframe_value + (time - last_keyframe_time) * last_keyframe[g_KEYFRAME_TANGENT_IN_VALUE];
                }
                else if (g_EXTRAP_TYPE_CYCLE == extrap_out)
                {
                        var time_interval = last_keyframe_time - first_keyframe_time;
                        var count = parseInt((time - last_keyframe_time) / time_interval);
                        time -= (1 + count) * time_interval;
                        return ChannelEvaluate(time, channel_idx);
                }
                else if (g_EXTRAP_TYPE_CYCLE_OFFSET == extrap_out)
                {
                        var time_interval = last_keyframe_time - first_keyframe_time;
                        var count = parseInt((time - last_keyframe_time) / time_interval);
                        time -= (1 + count) * time_interval;
                        return ChannelEvaluate(time, channel_idx) + (1 + count) * (last_keyframe_value - first_keyframe_value);
                }
                else
                {
                        alert("unhandled extrap_out type: " + extrap_out);
                }

                return last_keyframe_value;
        }

        return ChannelEvaluate(time, channel_idx);
}

