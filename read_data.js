"use strict"

// wasp_walk.skel
var g_BONE_NAME = 0;
var g_BONE_PARENT = 1;
var g_BONE_CHILDREN = 2;
var g_BONE_LOCAL_POSITION = 3;
var g_BONE_LOCAL_ROTATION = 4;
var g_BONE_BOX_MIN = 5;
var g_BONE_BOX_MAX = 6;
var g_BONE_ROT_X_LIMIT = 7;
var g_BONE_ROT_Y_LIMIT = 8;
var g_BONE_ROT_Z_LIMIT = 9;
var g_BONE_BINDING_MTX = 10;
var g_BONE_MODEL_MTX = 11;

var g_bones = [];

// wasp_walk.skin
var g_VERTEX_POSITION = 0;
var g_VERTEX_NORMAL = 1;
var g_VERTEX_WEIGHTS = 2;

var g_WEIGHT_BONE = 0;
var g_WEIGHT_VALUE = 1;

var g_skin_vertices = [];
var g_skin_triangle_list = [];

function ReadData ()
{

        jQuery.ajax({
                url:    "wasp_walk.skel",
                async:  false,
                success:function(result) {
                                ParseSkelData(result);
                        },
                error:  function (x, status, error) {
                                alert(status + ": " + error);
                        },
        });

        jQuery.ajax({
                url:    "wasp_walk.skin",
                async:  false,
                success:function(result) {
                                ParseSkinData(result);
                        },
                error:  function (x, status, error) {
                                alert(status + ": " + error);
                        },
        });

        jQuery.ajax({
                url:    "wasp_walk.anim",
                async:  false,
                success:function(result) {
                                ParseAnimData(result);
                        },
                error:  function (x, status, error) {
                                alert(status + ": " + error);
                        },
        });
        alert("here");
}

function ParseSkelData (skel_data)
{
        var BallJointTag = "balljoint";
        var OffsetTag = "offset";
        var BoxMinTag = "boxmin";
        var BoxMaxTag = "boxmax";
        var RotXLimitTag = "rotxlimit";
        var RotYLimitTag = "rotylimit";
        var RotZLimitTag = "rotzlimit";
        var PoseTag = "pose";

        var lines = skel_data.split("\n");
        var num_of_lines = lines.length;
        var line_idx = 0;
        var bone_idx = -1;

        while (line_idx < num_of_lines)
        {
                var line = lines[line_idx];
                ++line_idx;

                if (line.indexOf(BallJointTag) > -1)
                {
                        var bone_name = line.substring(line.indexOf(BallJointTag) + BallJointTag.length + 1, line.indexOf("{") - 1);

                        g_bones.push({
                                g_BONE_NAME : bone_name,
                        });

                        var new_bone_idx = g_bones.length - 1;

                        if (bone_idx != -1)
                        {
                                g_bones[new_bone_idx][g_BONE_PARENT] = bone_idx;

                                if (g_bones[bone_idx][g_BONE_CHILDREN])
                                {
                                        g_bones[bone_idx][g_BONE_CHILDREN].push(new_bone_idx);
                                }
                                else
                                {
                                        g_bones[bone_idx][g_BONE_CHILDREN] = [new_bone_idx];
                                }
                        }

                        bone_idx = new_bone_idx;
                }
                else if (line.indexOf(OffsetTag) > -1)
                {
                        var tokens = line.split(/ +/);
                        var offset_x = parseFloat(tokens[2]);
                        var offset_y = parseFloat(tokens[3]);
                        var offset_z = parseFloat(tokens[4]);

                        g_bones[bone_idx][g_BONE_LOCAL_POSITION] = [offset_x, offset_y, offset_z];
                }
                else if (line.indexOf(BoxMinTag) > -1)
                {
                        var tokens = line.split(/ +/);
                        var box_min_x = parseFloat(tokens[2]);
                        var box_min_y = parseFloat(tokens[3]);
                        var box_min_z = parseFloat(tokens[4]);

                        g_bones[bone_idx][g_BONE_BOX_MIN] = [box_min_x, box_min_y, box_min_z];
                }
                else if (line.indexOf(BoxMaxTag) > -1)
                {
                        var tokens = line.split(/ +/);
                        var box_max_x = parseFloat(tokens[2]);
                        var box_max_y = parseFloat(tokens[3]);
                        var box_max_z = parseFloat(tokens[4]);

                        g_bones[bone_idx][g_BONE_BOX_MAX] = [box_max_x, box_max_y, box_max_z];
                }
                else if (line.indexOf(RotXLimitTag) > -1)
                {
                        var tokens = line.split(/ +/);
                        var rot_x_min = parseFloat(tokens[2]);
                        var rot_x_max = parseFloat(tokens[3]);

                        g_bones[bone_idx][g_BONE_ROT_X_LIMIT] = [rot_x_min, rot_x_max];
                }
                else if (line.indexOf(RotYLimitTag) > -1)
                {
                        var tokens = line.split(/ +/);
                        var rot_y_min = parseFloat(tokens[2]);
                        var rot_y_max = parseFloat(tokens[3]);

                        g_bones[bone_idx][g_BONE_ROT_Y_LIMIT] = [rot_y_min, rot_y_max];
                }
                else if (line.indexOf(RotZLimitTag) > -1)
                {
                        var tokens = line.split(/ +/);
                        var rot_z_min = parseFloat(tokens[2]);
                        var rot_z_max = parseFloat(tokens[3]);

                        g_bones[bone_idx][g_BONE_ROT_Z_LIMIT] = [rot_z_min, rot_z_max];
                }
                else if (line.indexOf(PoseTag) > -1)
                {
                        var tokens = line.split(/ +/);
                        var pose_x = parseFloat(tokens[2]);
                        var pose_y = parseFloat(tokens[3]);
                        var pose_z = parseFloat(tokens[4]);

                        g_bones[bone_idx][g_BONE_LOCAL_ROTATION] = [pose_x, pose_y, pose_z];
                }
                else if (line.indexOf("}") > -1)
                {
                        bone_idx = g_bones[bone_idx][g_BONE_PARENT];
                }
        }
}

function ParseSkinData (skin_data)
{
        var PositionTag = "positions";
        var NormalTag = "normals";
        var SkinWeightsTag = "skinweights";
        var TriangleTag = "triangles";
        var BindingTag = "bindings";

        var lines = skin_data.split("\n");
        var num_of_lines = lines.length;
        var line_idx = 0;

        while (line_idx < num_of_lines)
        {
                var line = lines[line_idx];
                ++line_idx;

                if (line.indexOf(PositionTag) > -1)
                {
                        var num_of_skin_vertices = parseInt(line.substring(PositionTag.length + 1, line.indexOf("{") - 1));
                        
                        var x = 0.0;
                        var y = 0.0;
                        var z = 0.0;

                        for (var vertex_idx = 0; vertex_idx < num_of_skin_vertices; ++vertex_idx)
                        {
                                line = lines[line_idx];
                                ++line_idx;

                                var tokens = line.split(/ +/);

                                x = parseFloat(tokens[1]);
                                y = parseFloat(tokens[2]);
                                z = parseFloat(tokens[3]);

                                g_skin_vertices[vertex_idx] = {};
                                g_skin_vertices[vertex_idx][g_VERTEX_POSITION] = [x, y, z];
                        }
                }
                else if (line.indexOf(NormalTag) > -1)
                {
                        var num_of_vertices = parseInt(line.substring(NormalTag.length + 1, line.indexOf("{") - 1));

                        var x = 0.0;
                        var y = 0.0;
                        var z = 0.0;

                        for (var vertex_idx = 0; vertex_idx < num_of_vertices; ++vertex_idx)
                        {
                                line = lines[line_idx];
                                ++line_idx;

                                var tokens = line.split(/ +/);
                                x = parseFloat(tokens[1]);
                                y = parseFloat(tokens[2]);
                                z = parseFloat(tokens[3]);

                                g_skin_vertices[vertex_idx][g_VERTEX_NORMAL] = [x, y, z];
                        }
                }
                else if (line.indexOf(SkinWeightsTag) > -1)
                {
                        var num_of_vertices = parseInt(line.substring(SkinWeightsTag.length + 1, line.indexOf("{") - 1));

                        for (var vertex_idx = 0; vertex_idx < num_of_vertices; ++vertex_idx)
                        {
                                line = lines[line_idx];
                                ++line_idx;

                                var tokens = line.split(/ +/);
                                var effective_bones = parseInt(tokens[1]);

                                var weights_info = [];

                                for (var effective_bone_idx = 0; effective_bone_idx < effective_bones; ++effective_bone_idx)
                                {
                                        var bone_idx = parseInt(tokens[effective_bone_idx * 2 + 2]);
                                        var weight = parseFloat(tokens[effective_bone_idx * 2 + 3]);
                                        weights_info[effective_bone_idx] = {};
                                        weights_info[effective_bone_idx][g_WEIGHT_BONE] = bone_idx;
                                        weights_info[effective_bone_idx][g_WEIGHT_VALUE] = weight;
                                }

                                g_skin_vertices[vertex_idx][g_VERTEX_WEIGHTS] = weights_info;
                        }
                }
                else if (line.indexOf(TriangleTag) > -1)
                {
                        var num_of_triangles = parseInt(line.substring(TriangleTag.length + 1, line.indexOf("{") - 1));

                        for (var triangle_idx = 0; triangle_idx < num_of_triangles; ++triangle_idx)
                        {
                                line = lines[line_idx];
                                ++line_idx;

                                var tokens = line.split(/ +/);
                                var vertex_1 = parseInt(tokens[1]);
                                var vertex_2 = parseInt(tokens[2]);
                                var vertex_3 = parseInt(tokens[3]);

                                g_skin_triangle_list[triangle_idx] = [vertex_1, vertex_2, vertex_3];
                        }
                }
                else if (line.indexOf(BindingTag) > -1)
                {
                        var num_of_bones = parseInt(line.substring(BindingTag.length + 1, line.indexOf("{") - 1));

                        for (var bone_idx = 0; bone_idx < num_of_bones; ++bone_idx)
                        {
                                ++line_idx; // matrix {

                                var elements = [];

                                for (var row_idx = 0; row_idx < 4; ++row_idx)
                                {
                                        line = lines[line_idx];
                                        ++line_idx;

                                        var tokens = line.split(/ +/);
                                        var value_1 = parseFloat(tokens[1]);
                                        var value_2 = parseFloat(tokens[2]);
                                        var value_3 = parseFloat(tokens[3]);

                                        if (row_idx == 3)
                                        {
                                                elements.push([value_1, value_2, value_3, 1.0]);
                                        }
                                        else
                                        {
                                                elements.push([value_1, value_2, value_3, 0.0]);
                                        }
                                }

                                var mtx = Matrix.create(elements);
                                g_bones[bone_idx][g_BONE_BINDING_MTX] = mtx.transpose();

                                ++line_idx; // }
                        }
                }
        }
}

function ParseAnimData (anim_data)
{

}
