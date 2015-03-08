"use strict"

function CreateRotateX_4x4 (radian)
{
        return Matrix.create([
                [1,                0,                 0, 0],
                [0, Math.cos(radian), -Math.sin(radian), 0],
                [0, Math.sin(radian),  Math.cos(radian), 0],
                [0,                0,                 0, 1]
        ]);
}

function CreateRotateY_4x4 (radian)
{
        return Matrix.create([
                [ Math.cos(radian), 0, Math.sin(radian), 0],
                [                0, 1,                0, 0],
                [-Math.sin(radian), 0, Math.cos(radian), 0],
                [                0, 0,                0, 1]
        ]);
}

function CreateRotateZ_4x4 (radian)
{
        return Matrix.create([
                [Math.cos(radian), -Math.sin(radian), 0, 0],
                [Math.sin(radian),  Math.cos(radian), 0, 0],
                [               0,                 0, 1, 0],
                [               0,                 0, 0, 1],
        ]);
}

function CalcModelMatrix (bone_idx, parent_model_mtx)
{
        var local_translation = Matrix.create([
                [1, 0, 0, g_bones[bone_idx][g_BONE_LOCAL_POSITION][0]],
                [0, 1, 0, g_bones[bone_idx][g_BONE_LOCAL_POSITION][1]],
                [0, 0, 1, g_bones[bone_idx][g_BONE_LOCAL_POSITION][2]],
                [0, 0, 0, 1]
        ]);

        var local_rotation = Matrix.I(4);
        local_rotation = local_rotation.multiply(CreateRotateZ_4x4(g_bones[bone_idx][g_BONE_LOCAL_ROTATION][2]));
        local_rotation = local_rotation.multiply(CreateRotateY_4x4(g_bones[bone_idx][g_BONE_LOCAL_ROTATION][1]));
        local_rotation = local_rotation.multiply(CreateRotateX_4x4(g_bones[bone_idx][g_BONE_LOCAL_ROTATION][0]));

        var model_mtx = Matrix.I(4);
        model_mtx = model_mtx.multiply(parent_model_mtx);
        model_mtx = model_mtx.multiply(local_translation);
        model_mtx = model_mtx.multiply(local_rotation);

        g_bones[bone_idx][g_BONE_MODEL_MTX] = model_mtx;

        if (g_bones[bone_idx][g_BONE_CHILDREN])
        {
                for (var idx in g_bones[bone_idx][g_BONE_CHILDREN])
                {
                        var child_bone_idx = g_bones[bone_idx][g_BONE_CHILDREN][idx];
                        CalcModelMatrix(child_bone_idx, model_mtx);
                }
        }
}

function CalcWorldPosition (vertex_idx)
{
	var binding_pose_position = Vector.create([
		g_skin_vertices[vertex_idx][g_VERTEX_POSITION][0],
		g_skin_vertices[vertex_idx][g_VERTEX_POSITION][1],
		g_skin_vertices[vertex_idx][g_VERTEX_POSITION][2],
		1.0
	]);

	var world_position = Vector.Zero(4);
	var weights_info = g_skin_vertices[vertex_idx][g_VERTEX_WEIGHTS];

	for (var idx = 0; idx < weights_info.length; ++idx)
	{
		var bone_idx = weights_info[idx][g_WEIGHT_BONE];
                var weight = weights_info[idx][g_WEIGHT_VALUE];
		
		var binding_mtx = g_bones[bone_idx][g_BONE_BINDING_MTX];
		var binding_mtx_inverse = binding_mtx.inverse();
		var temp_position = binding_mtx_inverse.multiply(binding_pose_position);

		var bone_model_mtx = g_bones[bone_idx][g_BONE_MODEL_MTX];
		temp_position = bone_model_mtx.multiply(temp_position).multiply(weight);
		world_position = world_position.add(temp_position);
	}

        return world_position;
}

function CalcWorldNormal (vertex_idx)
{
	var binding_pose_normal = Vector.create([
		g_skin_vertices[vertex_idx][g_VERTEX_NORMAL][0],
		g_skin_vertices[vertex_idx][g_VERTEX_NORMAL][1],
		g_skin_vertices[vertex_idx][g_VERTEX_NORMAL][2],
		0.0
	]);

        var world_normal = Vector.Zero(4);
	var weights_info = g_skin_vertices[vertex_idx][g_VERTEX_WEIGHTS];

	for (var idx = 0; idx < weights_info.length; ++idx)
	{
		var bone_idx = weights_info[idx][g_WEIGHT_BONE];
                var weight = weights_info[idx][g_WEIGHT_VALUE];
		
		var binding_mtx = g_bones[bone_idx][g_BONE_BINDING_MTX];
		var binding_mtx_inverse = binding_mtx.inverse();
                var temp_normal = binding_mtx_inverse.multiply(binding_pose_normal);

		var bone_model_mtx = g_bones[bone_idx][g_BONE_MODEL_MTX];
                temp_normal = bone_model_mtx.multiply(temp_normal).multiply(weight);
                world_normal = world_normal.add(temp_normal);
	}

        return world_normal;
}
